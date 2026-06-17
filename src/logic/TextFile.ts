import type { Jar } from "../utils/Jar";
import type { JarEntryPath } from "../utils/Names";

const TEXT_LANGUAGES = new Map<string, string>([
    ['json', 'json'],
    ['mcmeta', 'json'],
    ['txt', 'plaintext'],
    ['properties', 'properties'],
    ['csv', 'plaintext'],
    ['xml', 'xml'],
    ['html', 'html'],
    ['js', 'javascript'],
    ['ts', 'typescript'],
    ['toml', 'plaintext'],
    ['yml', 'yaml'],
    ['yaml', 'yaml'],
    ['md', 'markdown'],
]);

function extension(path: string): string {
    return path.split('/').pop()?.split('.').pop()?.toLowerCase() ?? '';
}

export function isSupportedTextFilePath(path: string): path is JarEntryPath {
    return TEXT_LANGUAGES.has(extension(path));
}

export function getTextFileLanguage(path: string): string {
    return TEXT_LANGUAGES.get(extension(path)) ?? 'plaintext';
}

export async function readTextFile(path: JarEntryPath, jar: Jar): Promise<string> {
    const entry = jar.entries[path];
    if (!entry) {
        throw new Error(`File not found: ${path}`);
    }

    return entry.text();
}
