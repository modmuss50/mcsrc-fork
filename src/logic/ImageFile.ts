import type { Jar } from "../utils/Jar";
import type { JarEntryPath } from "../utils/Names";

export function isSupportedImageFilePath(path: string): path is JarEntryPath {
    return path.toLowerCase().endsWith(".png");
}

export async function readPngFile(path: JarEntryPath, jar: Jar): Promise<Blob> {
    const entry = jar.entries[path];
    if (!entry) {
        throw new Error(`File not found: ${path}`);
    }

    return entry.blob();
}
