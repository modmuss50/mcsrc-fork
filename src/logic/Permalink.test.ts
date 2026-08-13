import { describe, expect, it, vi } from "vitest";

vi.mock("./Settings", () => ({
    resetPermalinkAffectingSettings: vi.fn(),
    supportsPermalinking: { pipe: vi.fn() },
}));

vi.mock("./State", () => ({
    selectedModProjectId: { subscribe: vi.fn() },
    selectedModFileId: { subscribe: vi.fn() },
    selectedFile: { subscribe: vi.fn() },
    selectedLines: { subscribe: vi.fn() },
}));

import { parsePathToState } from "./Permalink";

describe("Modrinth permalinks", () => {
    it("rejects empty and incomplete paths", () => {
        expect(parsePathToState("")).toBeNull();
        expect(parsePathToState("1/project")).toBeNull();
        expect(parsePathToState("2/project/file")).toBeNull();
    });

    it("parses a project and file selection", () => {
        expect(parsePathToState("1/P7dR8mSH/gKytBifN")).toEqual({
            version: 1,
            projectId: "P7dR8mSH",
            fileId: "gKytBifN",
            file: undefined,
            selectedLines: null,
        });
    });

    it("parses a nested class path", () => {
        const state = parsePathToState("1/P7dR8mSH/gKytBifN/net/fabricmc/api/ModInitializer")!;
        expect(state.file).toBe("net/fabricmc/api/ModInitializer.class");
    });

    it("decodes identifiers", () => {
        const state = parsePathToState("1/project%2Bid/file%20id/example/Main")!;
        expect(state.projectId).toBe("project+id");
        expect(state.fileId).toBe("file id");
    });

    it("parses a single selected line", () => {
        const state = parsePathToState("1/project/file/example/Main#L42")!;
        expect(state.selectedLines).toEqual({ line: 42, lineEnd: undefined });
    });

    it("parses and preserves a selected line range", () => {
        const state = parsePathToState("1/project/file/example/Main%23L20-10")!;
        expect(state.selectedLines).toEqual({ line: 20, lineEnd: 10 });
    });
});
