import { combineLatest } from "rxjs";
import { resetPermalinkAffectingSettings, supportsPermalinking } from "./Settings";
import { diffView, selectedFile, selectedLines, selectedModFileId, selectedModProjectId } from "./State";
import { toClassFilePath, withoutClassExtension, type ClassFilePath } from "../utils/Names";

export interface State {
    version: number; // Allows us to change the permalink structure in the future
    projectId: string;
    fileId: string;
    file: ClassFilePath | undefined;
    selectedLines: {
        line: number;
        lineEnd?: number;
    } | null;
    diff?: { leftMinecraftVersion: string };
}

const DEFAULT_STATE: State = {
    version: 0,
    projectId: "",
    fileId: "",
    file: undefined,
    selectedLines: null
};

export const parsePathToState = (path: string): State | null => {
    // Check for line number marker (e.g., #L123 or #L10-20)
    let lineNumber: number | null = null;
    let lineEnd: number | null = null;
    const lineMatch = path.match(/(?:#|%23)L(\d+)(?:-(\d+))?$/);
    if (lineMatch) {
        lineNumber = parseInt(lineMatch[1], 10);
        if (lineMatch[2]) {
            lineEnd = parseInt(lineMatch[2], 10);
        }
        path = path.substring(0, lineMatch.index);
    }

    const segments = path.split('/').filter(s => s.length > 0);

    if (segments.length < 3) {
        return null;
    }

    const version = parseInt(segments[0], 10);

    if (!Number.isInteger(version) || version !== 1) return null;

    const projectId = decodeURIComponent(segments[1]);
    const fileId = decodeURIComponent(segments[2]);
    const filePath = segments.slice(3).join('/');
    if (!projectId || !fileId) return null;

    return {
        version,
        projectId,
        fileId,
        file: filePath ? toClassFilePath(filePath) : undefined,
        selectedLines: lineNumber ? { line: lineNumber, lineEnd: lineEnd || undefined } : null
    };
};

export const getInitialState = (): State => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;

    const newStyle = pathname !== '/' && pathname !== '';

    // Use pathname if it's not just "/" (new style), otherwise use hash (old style)
    let path = newStyle
        ? pathname.slice(1) // Remove leading /
        : (hash.startsWith('#/') ? hash.slice(2) : (hash.startsWith('#') ? hash.slice(1) : ''));

    // For new style (pathname-based), append hash if it contains line number
    if (newStyle && hash.startsWith('#L')) {
        path += hash;
    }

    try {
        const state = parsePathToState(path);
        if (state === null) {
            return DEFAULT_STATE;
        }

        resetPermalinkAffectingSettings();
        return state;
    } catch (e) {
        console.error("Error parsing permalink:", e);
        return DEFAULT_STATE;
    }
};

if (typeof window !== "undefined") {
    window.addEventListener('load', () => {
        combineLatest([
            selectedModProjectId,
            selectedModFileId,
            selectedFile,
            selectedLines,
            supportsPermalinking,
            diffView,
        ]).subscribe(([
            projectId,
            fileId,
            file,
            selectedLines,
            supported,
            comparing,
        ]) => {
            if (comparing) {
                document.title = "Compare · modsrc.dev";
                window.location.hash = '';
                window.history.replaceState({}, '', '/');
                return;
            }

            if (!projectId || !fileId) {
                document.title = "modsrc.dev";
                window.location.hash = '';
                window.history.replaceState({}, '', '/');
                return;
            }

            if (file) {
                const className = withoutClassExtension(file.split('/').pop() || file);
                document.title = className;
            } else {
                document.title = "modsrc.dev";
            }

            if (!supported) {
                window.location.hash = '';
                window.history.replaceState({}, '', '/');
                return;
            }

            let url = `/1/${encodeURIComponent(projectId)}/${encodeURIComponent(fileId)}`;
            if (file) {
                url += `/${withoutClassExtension(file)}`;
                if (selectedLines) {
                    const { line, lineEnd } = selectedLines;
                    url += lineEnd && lineEnd !== line
                        ? `#L${Math.min(line, lineEnd)}-${Math.max(line, lineEnd)}`
                        : `#L${line}`;
                }
            }

            window.history.replaceState({}, '', url);
        });
    });
}
