import type { MemberToken, Token } from "../logic/Tokens";
import type { JavadocData, JavadocString } from "./Javadoc";
import { javadocDirectory } from "./JavadocDirectory";

export interface EnigmaClass {
    srcName: string;
    dstName: string | null;
    comment: string | null;
    methods: Map<string, EnigmaMember>;
    fields: Map<string, EnigmaMember>;
    classes: EnigmaClass[];
}

export interface EnigmaMember {
    srcName: string;
    dstName: string | null;
    srcDesc: string;
    comment: string | null;
}

export interface EnigmaFile {
    classes: EnigmaClass[];
    classByName: Map<string, EnigmaClass>;
}

type MemberKind = "method" | "field";

const mappingFiles = new Map<string, EnigmaFile>();
let cachedDirectory: FileSystemDirectoryHandle | null = null;

export async function loadJavadocsForClass(className: string): Promise<JavadocData> {
    const file = await readMappingFile(className);
    const classes: JavadocData["classes"] = {};

    for (const clazz of file.classByName.values()) {
        classes[clazz.srcName] = {
            javadoc: clazz.comment,
            methods: commentsByMember(clazz.methods),
            fields: commentsByMember(clazz.fields)
        };
    }

    return { classes };
}

export async function saveTokenJavadoc(token: Token, documentation: JavadocString): Promise<void> {
    const file = await readMappingFile(token.className);
    const clazz = getOrCreateClass(file, token.className);

    if (token.type === "class") {
        clazz.comment = documentation || null;
    } else if (token.type === "method" || token.type === "field") {
        getOrCreateMember(clazz, token.type, token).comment = documentation || null;
    }

    await writeMappingFile(token.className, file);
}

async function readMappingFile(className: string): Promise<EnigmaFile> {
    if (cachedDirectory !== javadocDirectory.value) {
        mappingFiles.clear();
        cachedDirectory = javadocDirectory.value;
    }

    const rootClass = getRootClassName(className);
    const cached = mappingFiles.get(rootClass);
    if (cached) {
        return cached;
    }

    const text = await readMappingText(rootClass);
    const file = parseEnigmaFile(text);
    mappingFiles.set(rootClass, file);
    return file;
}

async function readMappingText(rootClass: string): Promise<string> {
    const directory = javadocDirectory.value;
    if (!directory) {
        return "";
    }

    try {
        const file = await getMappingFileHandle(rootClass, false);
        const blob = await file.getFile();
        return await blob.text();
    } catch (error) {
        if (isNotFoundError(error)) {
            return "";
        }

        throw error;
    }
}

async function writeMappingFile(className: string, file: EnigmaFile): Promise<void> {
    const handle = await getMappingFileHandle(getRootClassName(className), true);
    const writable = await handle.createWritable();
    await writable.write(formatEnigmaFile(file));
    await writable.close();
}

async function getMappingFileHandle(rootClass: string, create: boolean): Promise<FileSystemFileHandle> {
    const directory = javadocDirectory.value;
    if (!directory) {
        throw new Error("No Javadoc directory selected");
    }

    const mappings = await directory.getDirectoryHandle("mappings", { create });
    const path = rootClass.split("/");
    const fileName = `${path.pop()}.mapping`;
    let current = mappings;

    for (const segment of path) {
        current = await current.getDirectoryHandle(segment, { create });
    }

    return current.getFileHandle(fileName, { create });
}

export function parseEnigmaFile(text: string): EnigmaFile {
    const file: EnigmaFile = {
        classes: [],
        classByName: new Map()
    };
    const classStack: EnigmaClass[] = [];
    let lastMember: { indent: number; member: EnigmaMember; } | null = null;

    for (const rawLine of text.split(/\r?\n/)) {
        if (rawLine.length === 0) {
            continue;
        }

        const indent = countIndent(rawLine);
        const line = rawLine.slice(indent);

        if (line.startsWith("CLASS ")) {
            const [srcInnerName, dstInnerName] = line.slice("CLASS ".length).split(" ");
            const outer = indent > 0 ? classStack[indent - 1] : null;
            const srcName = outer && !srcInnerName.includes("$") ? `${outer.srcName}$${srcInnerName}` : srcInnerName;
            const dstName = getClassDstName(srcName, dstInnerName, outer);
            const clazz = createClass(srcName, dstName);

            classStack.length = indent;
            classStack[indent] = clazz;
            file.classByName.set(clazz.srcName, clazz);

            if (outer) {
                outer.classes.push(clazz);
            } else {
                file.classes.push(clazz);
            }

            lastMember = null;
            continue;
        }

        if (line.startsWith("METHOD ") || line.startsWith("FIELD ")) {
            const kind: MemberKind = line.startsWith("METHOD ") ? "method" : "field";
            const clazz = classStack[indent - 1];
            if (!clazz) {
                continue;
            }

            const member = parseMember(kind, line);
            getMemberMap(clazz, kind).set(memberKey(member.srcName, member.srcDesc), member);
            lastMember = { indent, member };
            continue;
        }

        if (line === "COMMENT" || line.startsWith("COMMENT ")) {
            const comment = line.length === "COMMENT".length ? "" : unescape(line.slice("COMMENT ".length));

            if (lastMember && indent === lastMember.indent + 1) {
                lastMember.member.comment = appendComment(lastMember.member.comment, comment);
            } else {
                const clazz = classStack[indent - 1];
                if (clazz) {
                    clazz.comment = appendComment(clazz.comment, comment);
                }
            }
        }
    }

    return file;
}

function parseMember(kind: MemberKind, line: string): EnigmaMember {
    const columns = line.slice(kind === "method" ? "METHOD ".length : "FIELD ".length).split(" ");
    const srcName = columns[0];
    const srcDesc = columns.length === 2 ? columns[1] : columns[2];

    return {
        srcName,
        dstName: columns.length === 2 ? null : columns[1],
        srcDesc,
        comment: null
    };
}

export function formatEnigmaFile(file: EnigmaFile): string {
    const lines: string[] = [];

    for (const clazz of file.classes) {
        writeClass(lines, clazz, null, 0);
    }

    return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}

function writeClass(lines: string[], clazz: EnigmaClass, outer: EnigmaClass | null, indent: number) {
    if (!shouldWriteClass(clazz)) {
        return;
    }

    const className = getInnerClassName(clazz.srcName, outer?.srcName);
    const dstName = clazz.dstName ? getInnerClassName(clazz.dstName, outer?.dstName ?? outer?.srcName) : null;
    lines.push(`${"\t".repeat(indent)}CLASS ${joinColumns(className, dstName)}`);
    writeComment(lines, clazz.comment, indent + 1);

    for (const field of sortedMembers(clazz.fields).filter(shouldWriteMember)) {
        writeMember(lines, "FIELD", field, indent + 1);
    }

    for (const method of sortedMembers(clazz.methods).filter(shouldWriteMember)) {
        writeMember(lines, "METHOD", method, indent + 1);
    }

    for (const child of clazz.classes.sort((a, b) => a.srcName.localeCompare(b.srcName))) {
        writeClass(lines, child, clazz, indent + 1);
    }
}

function writeMember(lines: string[], keyword: "FIELD" | "METHOD", member: EnigmaMember, indent: number) {
    lines.push(`${"\t".repeat(indent)}${keyword} ${joinColumns(member.srcName, member.dstName, member.srcDesc)}`);
    writeComment(lines, member.comment, indent + 1);
}

function shouldWriteClass(clazz: EnigmaClass): boolean {
    return !!clazz.comment
        || [...clazz.fields.values()].some(shouldWriteMember)
        || [...clazz.methods.values()].some(shouldWriteMember)
        || clazz.classes.some(shouldWriteClass);
}

function shouldWriteMember(member: EnigmaMember): boolean {
    return !!member.comment;
}

function writeComment(lines: string[], comment: string | null, indent: number) {
    if (!comment) {
        return;
    }

    for (const line of comment.split("\n")) {
        lines.push(`${"\t".repeat(indent)}COMMENT${line ? ` ${escape(line)}` : ""}`);
    }
}

function getOrCreateClass(file: EnigmaFile, className: string): EnigmaClass {
    const existing = file.classByName.get(className);
    if (existing) {
        return existing;
    }

    const outerName = getOuterClassName(className);
    const clazz = createClass(className, null);
    file.classByName.set(className, clazz);

    if (outerName) {
        getOrCreateClass(file, outerName).classes.push(clazz);
    } else {
        file.classes.push(clazz);
    }

    return clazz;
}

function getOrCreateMember(clazz: EnigmaClass, kind: MemberKind, token: MemberToken): EnigmaMember {
    const members = getMemberMap(clazz, kind);
    const key = memberKey(token.name, token.descriptor);
    const existing = members.get(key);
    if (existing) {
        return existing;
    }

    const member = {
        srcName: token.name,
        dstName: null,
        srcDesc: token.descriptor,
        comment: null
    };
    members.set(key, member);
    return member;
}

function createClass(srcName: string, dstName: string | null): EnigmaClass {
    return {
        srcName,
        dstName,
        comment: null,
        methods: new Map(),
        fields: new Map(),
        classes: []
    };
}

function commentsByMember(members: Map<string, EnigmaMember>): Record<string, JavadocString> {
    const comments: Record<string, JavadocString> = {};

    for (const [key, member] of members) {
        if (member.comment) {
            comments[key] = member.comment;
        }
    }

    return comments;
}

function getMemberMap(clazz: EnigmaClass, kind: MemberKind): Map<string, EnigmaMember> {
    return kind === "method" ? clazz.methods : clazz.fields;
}

function sortedMembers(members: Map<string, EnigmaMember>): EnigmaMember[] {
    return [...members.values()].sort((a, b) => memberKey(a.srcName, a.srcDesc).localeCompare(memberKey(b.srcName, b.srcDesc)));
}

function getClassDstName(srcName: string, dstInnerName: string | undefined, outer: EnigmaClass | null): string | null {
    if (!dstInnerName) {
        return null;
    }

    if (outer) {
        return `${outer.dstName ?? outer.srcName}$${dstInnerName}`;
    }

    return dstInnerName;
}

function getRootClassName(className: string): string {
    return className.split("$")[0];
}

function getOuterClassName(className: string): string | null {
    const index = className.lastIndexOf("$");
    return index < 0 ? null : className.slice(0, index);
}

function getInnerClassName(className: string, outerName: string | undefined): string {
    return outerName && className.startsWith(`${outerName}$`) ? className.slice(outerName.length + 1) : className;
}

function memberKey(name: string, descriptor: string): string {
    return name + descriptor;
}

function appendComment(current: string | null, line: string): string {
    return current == null ? line : `${current}\n${line}`;
}

function countIndent(line: string): number {
    let indent = 0;
    while (line[indent] === "\t") {
        indent++;
    }

    return indent;
}

function joinColumns(...columns: (string | null)[]): string {
    return columns.filter(column => column != null && column !== "").join(" ");
}

function escape(value: string): string {
    let result = "";

    for (const char of value) {
        switch (char) {
            case "\\":
                result += "\\\\";
                break;
            case "\n":
                result += "\\n";
                break;
            case "\r":
                result += "\\r";
                break;
            case "\0":
                result += "\\0";
                break;
            case "\t":
                result += "\\t";
                break;
            default:
                result += char;
                break;
        }
    }

    return result;
}

function unescape(value: string): string {
    return value.replace(/\\([\\nr0t])/g, (_, char: string) => {
        switch (char) {
            case "\\":
                return "\\";
            case "n":
                return "\n";
            case "r":
                return "\r";
            case "0":
                return "\0";
            case "t":
                return "\t";
        }

        return char;
    });
}

function isNotFoundError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "NotFoundError";
}
