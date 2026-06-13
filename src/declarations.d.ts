declare module "*/java.wasm-runtime.js" {
    export async function load(src: string);
}

interface Window {
    showDirectoryPicker(options?: {
        mode?: "read" | "readwrite";
    }): Promise<FileSystemDirectoryHandle>;
}
