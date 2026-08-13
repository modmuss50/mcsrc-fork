import { BehaviorSubject, EMPTY, catchError, combineLatest, filter, from, map, Observable, shareReplay, switchMap, tap } from "rxjs";
import { loadModJar, modJar, type ModJar } from "./ModrinthApi";
import { currentResult, decompileResultPipeline } from "./Decompiler";
import { calculatedLineChanges } from "./LineChanges";
import { diffComparisonFileId, selectedModFileId, selectedModProjectId } from "./State";
import type { DecompileResult } from "../workers/decompile/types";
import { classNameFromClassFilePath, isClassFilePath, toClassFilePath, withoutClassExtension, type ClassFilePath, type ClassName } from "../utils/Names";

export interface EntryInfo {
    classCrcs: Map<ClassName, number>;
}

export interface DiffSide {
    selectedFileId: BehaviorSubject<string | null>;
    jar: Observable<ModJar>;
    entries: Observable<Map<ClassFilePath, EntryInfo>>;
    result: Observable<DecompileResult>;
}

export const comparisonError = new BehaviorSubject<string | null>(null);

export const comparisonModJar = combineLatest([
    selectedModProjectId,
    diffComparisonFileId,
]).pipe(
    filter((selection): selection is [string, string] => selection[0] !== null && selection[1] !== null),
    tap(() => comparisonError.next(null)),
    switchMap(([projectId, fileId]) => from(loadModJar(projectId, fileId)).pipe(
        catchError((error: unknown) => {
            comparisonError.next(error instanceof Error ? error.message : "Unable to open this comparison file.");
            return EMPTY;
        }),
    )),
    shareReplay({ bufferSize: 1, refCount: false }),
);

let leftDiff: DiffSide | null = null;
export function getLeftDiff(): DiffSide {
    if (!leftDiff) {
        leftDiff = {} as DiffSide;
        leftDiff.selectedFileId = diffComparisonFileId;
        leftDiff.jar = comparisonModJar;
        leftDiff.entries = leftDiff.jar.pipe(
            switchMap(jar => from(getEntriesWithCRC(jar)))
        );
        leftDiff.result = decompileResultPipeline(leftDiff.jar);
    }
    return leftDiff;
}

let rightDiff: DiffSide | null = null;
export function getRightDiff(): DiffSide {
    if (!rightDiff) {
        rightDiff = {
            selectedFileId: selectedModFileId,
            jar: modJar,
            entries: modJar.pipe(
                switchMap(jar => from(getEntriesWithCRC(jar)))
            ),
            result: currentResult
        };
    }
    return rightDiff;
}

export interface DiffSummary {
    added: number;
    deleted: number;
    modified: number;
}

export interface ChangeInfo {
    state: ChangeState;
    additions?: number;
    deletions?: number;
}

let clearLineChangesSubscriptionStarted = false;
function ensureClearLineChangesSubscription() {
    if (clearLineChangesSubscriptionStarted) return;
    clearLineChangesSubscriptionStarted = true;

    combineLatest([
        diffComparisonFileId,
        selectedModFileId
    ]).subscribe(() => {
        calculatedLineChanges.next(new Map());
    });
}

let diffChanges: Observable<Map<ClassFilePath, ChangeInfo>> | null = null;
export function getDiffChanges(): Observable<Map<ClassFilePath, ChangeInfo>> {
    if (!diffChanges) {
        ensureClearLineChangesSubscription();
        diffChanges = combineLatest([
            getLeftDiff().entries,
            getRightDiff().entries,
            calculatedLineChanges
        ]).pipe(
            map(([leftEntries, rightEntries, lineChanges]) => {
                const changes = getChangedEntries(leftEntries, rightEntries);
                lineChanges.forEach((counts, file) => {
                    if (!isClassFilePath(file)) return;
                    const info = changes.get(file);
                    if (info) {
                        info.additions = counts.additions;
                        info.deletions = counts.deletions;
                    }
                });
                return changes;
            }),
            shareReplay(1)
        );
    }
    return diffChanges;
}

let diffSummaryObs: Observable<DiffSummary> | null = null;
export function getDiffSummary(): Observable<DiffSummary> {
    if (!diffSummaryObs) {
        diffSummaryObs = getDiffChanges().pipe(
            map(changes => {
                const summary: DiffSummary = { added: 0, deleted: 0, modified: 0 };
                changes.forEach(info => {
                    summary[info.state]++;
                });
                return summary;
            }),
            shareReplay(1)
        );
    }
    return diffSummaryObs;
}

export type ChangeState = "added" | "deleted" | "modified";

async function getEntriesWithCRC(jar: ModJar): Promise<Map<ClassFilePath, EntryInfo>> {
    const entries = new Map<ClassFilePath, EntryInfo>();

    for (const [path, file] of Object.entries(jar.jar.entries)) {
        if (!isClassFilePath(path) || !file) {
            continue;
        }

        const className = classNameFromClassFilePath(path);
        const lastSlash = path.lastIndexOf('/');
        const folder = lastSlash !== -1 ? path.substring(0, lastSlash + 1) : '';
        const fileName = path.substring(folder.length);
        const baseFileName = fileName.includes('$') ? fileName.split('$')[0] : withoutClassExtension(fileName);
        const baseClassName = toClassFilePath(folder + baseFileName);

        const existing = entries.get(baseClassName);
        if (existing) {
            existing.classCrcs.set(className, file.crc32);
        } else {
            entries.set(baseClassName, {
                classCrcs: new Map([[className, file.crc32]]),
            });
        }
    }

    return entries;
}

function getChangedEntries(
    leftEntries: Map<ClassFilePath, EntryInfo>,
    rightEntries: Map<ClassFilePath, EntryInfo>
): Map<ClassFilePath, ChangeInfo> {
    const changes = new Map<ClassFilePath, ChangeInfo>();

    const allKeys = new Set<ClassFilePath>([
        ...leftEntries.keys(),
        ...rightEntries.keys()
    ]);

    for (const key of allKeys) {
        const leftInfo = leftEntries.get(key);
        const rightInfo = rightEntries.get(key);

        if (leftInfo === undefined) {
            changes.set(key, { state: "added" });
        } else if (rightInfo === undefined) {
            changes.set(key, { state: "deleted" });
        } else {
            const leftClasses = leftInfo.classCrcs;
            const rightClasses = rightInfo.classCrcs;

            // Check if any of the classes (including inner classes) have changed by comparing their CRCs.
            // A Map is used to track the CRC of each individual class file that belongs to this base class.
            const hasChanges = leftClasses.size !== rightClasses.size ||
                Array.from(leftClasses.entries()).some(([className, leftCrc]) => rightClasses.get(className) !== leftCrc);

            if (!hasChanges) {
                continue;
            }

            changes.set(key, { state: "modified" });
        }
    }

    return changes;
}
