import { BehaviorSubject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./State", () => ({
    selectedModProjectId: new BehaviorSubject<string | null>(null),
    selectedModFileId: new BehaviorSubject<string | null>(null),
}));

vi.mock("../utils/Jar", () => ({ openJar: vi.fn() }));

import {
    findPrimaryFile,
    getPrimaryFile,
    getSelectableVersions,
    searchModrinthProjects,
    type ModrinthFile,
    type ModrinthVersion,
} from "./ModrinthApi";

const file = (id: string, filename: string, primary = false): ModrinthFile => ({
    id,
    filename,
    primary,
    hashes: { sha1: id },
    url: `https://cdn.modrinth.com/${filename}`,
    size: 10,
    file_type: null,
});

const version = (id: string, files: ModrinthFile[]): ModrinthVersion => ({
    id,
    project_id: "project",
    name: id,
    version_number: id,
    version_type: "release",
    date_published: "2026-01-01T00:00:00Z",
    game_versions: ["1.21.1"],
    loaders: ["fabric"],
    files,
});

afterEach(() => vi.unstubAllGlobals());

describe("Modrinth API", () => {
    it("encodes mod-only searches and pagination", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ hits: [], offset: 20, limit: 20, total_hits: 0 })));
        vi.stubGlobal("fetch", fetchMock);

        await searchModrinthProjects("fabric api", 20);

        const url = new URL(fetchMock.mock.calls[0][0]);
        expect(url.pathname).toBe("/v2/search");
        expect(url.searchParams.get("query")).toBe("fabric api");
        expect(url.searchParams.get("facets")).toBe('[["project_type:mod"]]');
        expect(url.searchParams.get("offset")).toBe("20");
        expect(url.searchParams.get("limit")).toBe("20");
    });

    it("uses the marked primary file or falls back to the first file", () => {
        expect(getPrimaryFile(version("one", [file("a", "a.jar"), file("b", "b.jar", true)]))?.id).toBe("b");
        expect(getPrimaryFile(version("two", [file("a", "a.jar"), file("b", "b.jar")]))?.id).toBe("a");
    });

    it("keeps only versions whose primary artifact is a JAR", () => {
        const versions = [
            version("jar", [file("jar-file", "mod.jar", true)]),
            version("zip", [file("zip-file", "mod.zip", true), file("secondary", "mod.jar")]),
        ];
        expect(getSelectableVersions(versions).map(item => item.id)).toEqual(["jar"]);
    });

    it("finds files only when they are the selected primary JAR", () => {
        const versions = [version("one", [file("secondary", "sources.jar"), file("primary", "mod.jar", true)])];
        expect(findPrimaryFile(versions, "primary")?.id).toBe("one");
        expect(findPrimaryFile(versions, "secondary")).toBeUndefined();
    });

    it("reports rate limiting clearly", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429, statusText: "Too Many Requests" })));
        await expect(searchModrinthProjects("test")).rejects.toThrow("rate limit");
    });
});
