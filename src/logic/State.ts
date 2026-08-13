import { BehaviorSubject } from "rxjs";
import { combineLatest } from "rxjs";
import { pairwise } from "rxjs/operators";
import { Tab, CodeTab } from "./tabs";
import { getInitialState } from "./Permalink";
import type { ClassFilePath } from "../utils/Names";
import type { ReferenceKey } from "../workers/jar-index/types";

const initialState = getInitialState();

/// All of the user controled global state should be defined here:

export const selectedModProjectId = new BehaviorSubject<string | null>(initialState.projectId);
export const selectedModFileId = new BehaviorSubject<string | null>(initialState.fileId);

export function selectModArtifact(projectId: string, fileId: string): void {
    selectedModFileId.next(null);
    selectedModProjectId.next(projectId);
    selectedModFileId.next(fileId);
}

// Kept for the inactive legacy diff modules until they are removed completely.
export const selectedMinecraftVersion = new BehaviorSubject<string | null>(null);

export const mobileDrawerOpen = new BehaviorSubject(false);
export const selectedFile = new BehaviorSubject<ClassFilePath | undefined>(initialState.file);
const initialTab = initialState.file ? new CodeTab(initialState.file) : null;
export const openTab = new BehaviorSubject<Tab | null>(initialTab);
export const openTabs = new BehaviorSubject<Tab[]>(initialTab ? [initialTab] : []);
export const tabHistory = new BehaviorSubject<string[]>(initialState.file ? [initialState.file] : []);
export const searchQuery = new BehaviorSubject("");
export const referencesQuery = new BehaviorSubject<ReferenceKey | "">("");

export interface SelectedLines {
    line: number;
    lineEnd?: number;
}
export const selectedLines = new BehaviorSubject<SelectedLines | null>(initialState.selectedLines);

export const diffView = new BehaviorSubject<boolean>(!!initialState.diff);
export const diffLeftSelectedMinecraftVersion = new BehaviorSubject<string | null>(initialState.diff?.leftMinecraftVersion ?? null);

// Reset selected lines when file changes (skip initial emission to preserve permalink selection)
selectedFile.pipe(pairwise()).subscribe(([previousFile, currentFile]) => {
    if (previousFile !== currentFile) {
        selectedLines.next(null);
    }
});

combineLatest([selectedModProjectId, selectedModFileId]).pipe(pairwise()).subscribe(([previous, current]) => {
    if (previous[0] === current[0] && previous[1] === current[1]) return;
    selectedFile.next(undefined);
    openTab.next(null);
    openTabs.next([]);
    tabHistory.next([]);
    searchQuery.next("");
    referencesQuery.next("");
});
