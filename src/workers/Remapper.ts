import { endpointSymbol } from "vite-plugin-comlink/symbol";

export async function remapJar(jarData: ArrayBufferLike, mappings: string): Promise<Int8Array> {
    const worker = createWrorker();
    try {
        return worker.remapJar(jarData, mappings);
    } finally {
        worker[endpointSymbol].terminate();
    }
}

type JarIndexWorker = typeof import("./JarIndexWorker");

function createWrorker() {
    return new ComlinkWorker<JarIndexWorker>(
        new URL("./JarIndexWorker", import.meta.url),
    );
}