import { combineLatest } from "rxjs";
import { resetPermalinkAffectingSettings, supportsPermalinking } from "./Settings";
import { diffView, selectedFile, selectedLines, selectedMinecraftVersion, type Selection } from "./State";

export interface State {
    version: number; // Allows us to change the permalink structure in the future
    minecraftVersion: string;
    file: string;
    selectedLines: Selection | null;
}

const DEFAULT_STATE: State = {
    version: 0,
    minecraftVersion: "",
    file: "net/minecraft/ChatFormatting.class",
    selectedLines: null
};

export const parsePathToState = (path: string): State | null => {
    let selection: Selection | null = null;

    // Check for line number marker first (e.g., #L123 or #L10-20)
    const lineMatch = path.match(/(?:#|%23)L(\d+)(?:-(\d+))?$/);
    if (lineMatch) {
        const lineNumber = parseInt(lineMatch[1], 10);
        const lineEnd = lineMatch[2] ? parseInt(lineMatch[2], 10) : undefined;
        selection = {
            type: 'lines',
            line: lineNumber,
            lineEnd
        };
        path = path.substring(0, lineMatch.index);
    } else {
        // Check for token-based marker (e.g., #methodName(descriptor) or #fieldName)
        // Method descriptors always start with '(', so we can distinguish them from fields
        const tokenMatch = path.match(/(?:#|%23)([a-zA-Z_$][a-zA-Z0-9_$]*)(\(.+)?$/);
        if (tokenMatch) {
            const tokenName = tokenMatch[1];
            const tokenDescriptor = tokenMatch[2];
            selection = {
                type: 'token',
                tokenType: tokenDescriptor ? 'method' : 'field',
                tokenName,
                tokenDescriptor
            };
            path = path.substring(0, tokenMatch.index);
        }
    }

    const segments = path.split('/').filter(s => s.length > 0);

    if (segments.length < 3) {
        return null;
    }

    const version = parseInt(segments[0], 10);
    let minecraftVersion = decodeURIComponent(segments[1]);
    const filePath = segments.slice(2).join('/');

    // Backwards compatibility with the incorrect version name used previously
    if (minecraftVersion == "25w45a") {
        minecraftVersion = "25w45a_unobfuscated";
    }

    const result = {
        version,
        minecraftVersion,
        file: filePath + (filePath.endsWith('.class') ? '' : '.class'),
        selectedLines: selection
    };

    return result;
};

export const getInitialState = (): State => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;

    const newStyle = pathname !== '/' && pathname !== '';

    // Use pathname if it's not just "/" (new style), otherwise use hash (old style)
    let path = newStyle
        ? pathname.slice(1) // Remove leading /
        : (hash.startsWith('#/') ? hash.slice(2) : (hash.startsWith('#') ? hash.slice(1) : ''));

    // For new style (pathname-based), append hash if it contains line number or token
    if (newStyle && hash.startsWith('#')) {
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
            selectedMinecraftVersion,
            selectedFile,
            selectedLines,
            supportsPermalinking,
            diffView
        ]).subscribe(([
            minecraftVersion,
            file,
            selectedLines,
            supported,
            diffView
        ]) => {
            const className = file.split('/').pop()?.replace('.class', '') || file;
            document.title = className;

            if (!supported || diffView) {
                window.location.hash = '';
                window.history.replaceState({}, '', '/');
                return;
            }

            let url = `/1/${minecraftVersion}/${file.replace(".class", "")}`;

            if (selectedLines) {
                if (selectedLines.type === 'token') {
                    // Token-based permalink
                    if (selectedLines.tokenType === 'method' && selectedLines.tokenDescriptor) {
                        url += `#${selectedLines.tokenName}${selectedLines.tokenDescriptor}`;
                    } else if (selectedLines.tokenType === 'field') {
                        url += `#${selectedLines.tokenName}`;
                    }
                } else {
                    // Line-based permalink
                    const { line, lineEnd } = selectedLines;
                    if (lineEnd && lineEnd !== line) {
                        url += `#L${Math.min(line, lineEnd)}-${Math.max(line, lineEnd)}`;
                    } else {
                        url += `#L${line}`;
                    }
                }
            }

            window.history.replaceState({}, '', url);
        });
    });
}
