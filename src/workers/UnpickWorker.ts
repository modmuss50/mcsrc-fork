import { load } from "../../java/build/generated/teavm/wasm-gc/java.wasm-runtime.js";
import indexerWasm from '../../java/build/generated/teavm/wasm-gc/java.wasm?url';
import { openJar, streamJar, type Jar } from "../utils/Jar.js";
import type { Indexer } from "./JavaDef.js";

let indexerFunc: Indexer | null = null;

const getIndexer = async (): Promise<Indexer> => {
    if (!indexerFunc) {
        try {
            const teavm = await load(indexerWasm);
            indexerFunc = teavm.exports as Indexer;
        } catch (e) {
            console.warn("Failed to load WASM module (non-compliant browser?), falling back to JS implementation", e);
            indexerFunc = await import("../../java/build/generated/teavm/js/java.js") as unknown as Indexer;
        }
    }
    return indexerFunc;
};

let jar: Jar | null = null;
let libraries: Jar[] = [];

export const setWorkerJar = async (blob: Blob | null, libraryUrls: string[]) => {
    if (!blob) {
        jar = null;
        console.log("cleared jar in worker");
        return;
    }

    jar = await openJar(blob);
    libraries = await Promise.all(libraryUrls.map(async (url) => {
        return await streamJar(url);
    }));

    console.log("created jars");
};

import testDef from './test.unpick?raw';

export const unpick = async (className: string, definition: string): Promise<Int8Array> => {
    const indexer = await getIndexer();
    return indexer.unpick(className, testDef, {
        resolveClass: async (className: string): Promise<Uint8Array | null> => {
            console.log(`Resolving class ${className}`);
            return null;
        }
    });
};