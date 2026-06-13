import { describe, expect, it } from "vitest";
import { formatEnigmaFile, parseEnigmaFile } from "./EnigmaMappings";

describe("EnigmaMappings", () => {
    it("reads class and member comments", () => {
        const file = parseEnigmaFile([
            "CLASS net/minecraft/Foo RenamedFoo",
            "\tCOMMENT Class docs",
            "\tCOMMENT second line",
            "\tFIELD count renamedCount I",
            "\t\tCOMMENT Field docs",
            "\tMETHOD run renamedRun ()V",
            "\t\tCOMMENT Method docs"
        ].join("\n"));

        const clazz = file.classByName.get("net/minecraft/Foo")!;
        expect(clazz.dstName).toBe("RenamedFoo");
        expect(clazz.comment).toBe("Class docs\nsecond line");
        expect(clazz.fields.get("countI")?.comment).toBe("Field docs");
        expect(clazz.methods.get("run()V")?.comment).toBe("Method docs");
    });

    it("handles nested classes like mapping-io Enigma files", () => {
        const file = parseEnigmaFile([
            "CLASS net/minecraft/Foo",
            "\tCLASS Inner RenamedInner",
            "\t\tCOMMENT Inner docs",
            "\t\tMETHOD tick ()V",
            "\t\t\tCOMMENT Tick docs"
        ].join("\n"));

        const inner = file.classByName.get("net/minecraft/Foo$Inner")!;
        expect(inner.dstName).toBe("net/minecraft/Foo$RenamedInner");
        expect(inner.comment).toBe("Inner docs");
        expect(inner.methods.get("tick()V")?.comment).toBe("Tick docs");
    });

    it("writes comments with mapping-io escaping", () => {
        const file = parseEnigmaFile("CLASS net/minecraft/Foo\n");
        const clazz = file.classByName.get("net/minecraft/Foo")!;
        clazz.comment = "Slash \\\nTab\tNull \0";

        expect(formatEnigmaFile(file)).toBe([
            "CLASS net/minecraft/Foo",
            "\tCOMMENT Slash \\\\",
            "\tCOMMENT Tab\\tNull \\0",
            ""
        ].join("\n"));
    });

    it("round trips destination names and comments", () => {
        const source = [
            "CLASS net/minecraft/Foo RenamedFoo",
            "\tFIELD value renamedValue Ljava/lang/String;",
            "\t\tCOMMENT Field docs",
            "\tMETHOD getValue renamedGetValue ()Ljava/lang/String;",
            "\t\tCOMMENT Method docs",
            ""
        ].join("\n");

        expect(formatEnigmaFile(parseEnigmaFile(source))).toBe(source);
    });

    it("does not write members without docs", () => {
        const source = [
            "CLASS net/minecraft/Foo RenamedFoo",
            "\tFIELD value renamedValue Ljava/lang/String;",
            "\tMETHOD getValue renamedGetValue ()Ljava/lang/String;",
            ""
        ].join("\n");

        expect(formatEnigmaFile(parseEnigmaFile(source))).toBe("");
    });

    it("removes members when their docs are cleared", () => {
        const file = parseEnigmaFile([
            "CLASS net/minecraft/Foo RenamedFoo",
            "\tFIELD value renamedValue Ljava/lang/String;",
            "\t\tCOMMENT Field docs",
            ""
        ].join("\n"));
        file.classByName.get("net/minecraft/Foo")!.fields.get("valueLjava/lang/String;")!.comment = null;

        expect(formatEnigmaFile(file)).toBe("");
    });
});
