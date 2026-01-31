import type { MinecraftJar } from "../logic/MinecraftApi";
import { endpointSymbol } from "vite-plugin-comlink/symbol";

type UnpickWorker = typeof import("./UnpickWorker");

export async function unpick(className: string, definition: string, jar: MinecraftJar): Promise<Uint8Array> {
    const worker = createWrorker();
    console.log(`Unpicking class ${className} in worker`);
    try {
        const libs = jar.versionManifest.libraries.map(lib => {
            return lib.downloads?.artifact?.url;
        }).filter((url): url is string => url !== undefined)
            .map(url => {
                return url.replace("https://libraries.minecraft.net/", "/libraries/");
            }).filter(url => url.includes("/lwjgl-glfw-3.3.3.jar"));

        await worker.setWorkerJar(jar.blob, libs);
        const result = await worker.unpick(className, definition);
        return new Uint8Array(result);
    } finally {
        worker[endpointSymbol].terminate();
    }
};

function createWrorker() {
    return new ComlinkWorker<UnpickWorker>(
        new URL("./UnpickWorker", import.meta.url),
        {
        }
    );
}
