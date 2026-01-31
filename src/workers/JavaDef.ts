import type { UsageKey, UsageString } from "./JarIndex.js";

export type ClassDataString = `${string}|${string}|${number}|${string}`;

export interface UnpickOptions {
    resolveClass: (className: string) => Promise<Uint8Array | null>;
}

export interface Indexer {
    index(data: ArrayBufferLike): void;
    getUsage(key: UsageKey): [UsageString];
    getUsageSize(): number;
    getBytecode(classData: ArrayBufferLike[]): string;
    getClassData(): ClassDataString[];
    unpick(className: string, definition: string, options: UnpickOptions): Int8Array;
}