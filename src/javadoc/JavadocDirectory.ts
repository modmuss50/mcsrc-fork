import { BehaviorSubject, filter, firstValueFrom, map } from "rxjs";
import { minecraftVersionIds } from "../logic/MinecraftApi";
import { selectedMinecraftVersion } from "../logic/State";

interface McsrcConfig {
    minecraftVersion: string;
}

export const javadocDirectory = new BehaviorSubject<FileSystemDirectoryHandle | null>(null);

export const needsJavadocDirectory = javadocDirectory.pipe(
    map(directory => directory == null)
);

export async function openJavadocDirectory() {
    const directory = await window.showDirectoryPicker({
        mode: "readwrite"
    });
    await loadOrCreateMcsrcConfig(directory);
    javadocDirectory.next(directory);
}

async function loadOrCreateMcsrcConfig(directory: FileSystemDirectoryHandle) {
    try {
        const configFile = await directory.getFileHandle("mcsrc.json");
        const config = JSON.parse(await (await configFile.getFile()).text()) as Partial<McsrcConfig>;

        if (typeof config.minecraftVersion !== "string" || config.minecraftVersion.length === 0) {
            throw new Error("mcsrc.json must contain a minecraftVersion string");
        }

        selectedMinecraftVersion.next(config.minecraftVersion);
    } catch (error) {
        if (!(error instanceof DOMException && error.name === "NotFoundError")) {
            throw error;
        }

        const minecraftVersion = await getSelectedOrDefaultMinecraftVersion();
        const configFile = await directory.getFileHandle("mcsrc.json", { create: true });
        const writable = await configFile.createWritable();
        await writable.write(JSON.stringify({ minecraftVersion } satisfies McsrcConfig, null, 2) + "\n");
        await writable.close();
    }
}

async function getSelectedOrDefaultMinecraftVersion(): Promise<string> {
    const currentVersion = selectedMinecraftVersion.value;
    if (currentVersion) {
        return currentVersion;
    }

    await firstValueFrom(minecraftVersionIds.pipe(filter(versions => versions.length > 0)));

    const defaultVersion = selectedMinecraftVersion.value;
    if (!defaultVersion) {
        throw new Error("No Minecraft version selected");
    }

    return defaultVersion;
}
