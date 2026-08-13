import {
    BehaviorSubject,
    EMPTY,
    catchError,
    combineLatest,
    distinctUntilChanged,
    filter,
    from,
    shareReplay,
    switchMap,
    tap,
} from "rxjs";
import { openJar, type Jar } from "../utils/Jar";
import { selectedModFileId, selectedModProjectId } from "./State";

const API_URL = "https://api.modrinth.com/v2";
const CACHE_NAME = "modsrc-v1";

export interface ModrinthSearchResponse {
    hits: ModrinthProject[];
    offset: number;
    limit: number;
    total_hits: number;
}

export interface ModrinthProject {
    project_id: string;
    id?: string;
    slug: string;
    title: string;
    description: string;
    author?: string;
    icon_url: string | null;
    project_type: string;
    categories: string[];
    versions?: string[];
    game_versions?: string[];
    loaders?: string[];
}

export interface ModrinthFile {
    id: string;
    hashes: Record<string, string>;
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    file_type: string | null;
}

export interface ModrinthVersion {
    id: string;
    project_id: string;
    name: string;
    version_number: string;
    version_type: "release" | "beta" | "alpha";
    date_published: string;
    game_versions: string[];
    loaders: string[];
    files: ModrinthFile[];
}

export interface SelectableModrinthVersion extends ModrinthVersion {
    primaryFile: ModrinthFile;
}

export interface ModJar {
    project: ModrinthProject;
    version: ModrinthVersion;
    file: ModrinthFile;
    jar: Jar;
    blob: Blob;
}

export class ModrinthApiError extends Error {
    readonly status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "ModrinthApiError";
        this.status = status;
    }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        headers: { Accept: "application/json" },
        signal,
    });

    if (!response.ok) {
        const rateLimited = response.status === 429;
        throw new ModrinthApiError(
            rateLimited
                ? "Modrinth's rate limit was reached. Please wait a moment and try again."
                : `Modrinth request failed (${response.status} ${response.statusText}).`,
            response.status,
        );
    }

    return response.json() as Promise<T>;
}

export function searchModrinthProjects(query: string, offset = 0, limit = 20, signal?: AbortSignal): Promise<ModrinthSearchResponse> {
    const params = new URLSearchParams({
        query,
        facets: JSON.stringify([["project_type:mod"]]),
        index: "relevance",
        offset: String(offset),
        limit: String(limit),
    });
    return getJson<ModrinthSearchResponse>(`/search?${params}`, signal);
}

export async function getModrinthProject(projectId: string): Promise<ModrinthProject> {
    const project = await getJson<ModrinthProject>(`/project/${encodeURIComponent(projectId)}`);
    return {
        ...project,
        project_id: project.project_id ?? project.id ?? projectId,
    };
}

export function getModrinthProjectVersions(projectId: string): Promise<ModrinthVersion[]> {
    return getJson<ModrinthVersion[]>(`/project/${encodeURIComponent(projectId)}/version?include_changelog=false`);
}

export function getPrimaryFile(version: ModrinthVersion): ModrinthFile | undefined {
    return version.files.find(file => file.primary) ?? version.files[0];
}

export function getSelectableVersions(versions: ModrinthVersion[]): SelectableModrinthVersion[] {
    return versions.flatMap(version => {
        const primaryFile = getPrimaryFile(version);
        return primaryFile?.filename.toLowerCase().endsWith(".jar")
            ? [{ ...version, primaryFile }]
            : [];
    });
}

export function findPrimaryFile(versions: ModrinthVersion[], fileId: string): SelectableModrinthVersion | undefined {
    return getSelectableVersions(versions).find(version => version.primaryFile.id === fileId);
}

async function consumeResponseWithProgress(response: Response, onProgress: (percent: number) => void): Promise<Blob> {
    const total = Number(response.headers.get("content-length")) || 0;
    if (!response.body || total === 0) return response.blob();

    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let received = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        onProgress(Math.round(received / total * 100));
    }

    return new Blob(chunks, { type: response.headers.get("content-type") ?? "application/java-archive" });
}

async function downloadModFile(file: ModrinthFile): Promise<Blob> {
    const cache = "caches" in window ? await caches.open(CACHE_NAME) : null;
    const cached = await cache?.match(file.url);
    if (cached) return cached.blob();

    const response = await fetch(file.url);
    if (!response.ok) {
        throw new ModrinthApiError(`Failed to download ${file.filename} (${response.status} ${response.statusText}).`, response.status);
    }

    const blob = await consumeResponseWithProgress(response, percent => downloadProgress.next(percent));
    try {
        await cache?.put(file.url, new Response(blob, { headers: { "Content-Type": blob.type } }));
    } catch (error) {
        console.warn(`Failed to cache ${file.filename}`, error);
    }
    return blob;
}

export async function loadModJar(projectId: string, fileId: string): Promise<ModJar> {
    const [project, versions] = await Promise.all([
        getModrinthProject(projectId),
        getModrinthProjectVersions(projectId),
    ]);
    const selectedVersion = findPrimaryFile(versions, fileId);
    if (!selectedVersion) {
        throw new ModrinthApiError("This file is missing, is not a primary JAR, or no longer belongs to this project.", 404);
    }

    const file = selectedVersion.primaryFile;
    downloadProgress.next(0);
    try {
        const blob = await downloadModFile(file);
        const jar = await openJar(`${projectId}:${fileId}`, blob);
        return { project, version: selectedVersion, file, jar, blob };
    } catch (error) {
        if (error instanceof ModrinthApiError) throw error;
        throw new ModrinthApiError(`${file.filename} is not a valid JAR: ${(error as Error).message}`);
    } finally {
        downloadProgress.next(undefined);
    }
}

export const downloadProgress = new BehaviorSubject<number | undefined>(undefined);
export const artifactError = new BehaviorSubject<string | null>(null);

export const modJar = combineLatest([selectedModProjectId, selectedModFileId]).pipe(
    filter((selection): selection is [string, string] => selection[0] !== null && selection[1] !== null),
    distinctUntilChanged(([oldProject, oldFile], [project, file]) => oldProject === project && oldFile === file),
    tap(() => artifactError.next(null)),
    switchMap(([projectId, fileId]) => from(loadModJar(projectId, fileId)).pipe(
        catchError((error: unknown) => {
            artifactError.next(error instanceof Error ? error.message : "Unable to open this mod file.");
            return EMPTY;
        }),
    )),
    shareReplay({ bufferSize: 1, refCount: false }),
);
