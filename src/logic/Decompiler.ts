import {
    BehaviorSubject,
    combineLatest, distinctUntilChanged, from, map, Observable, of, shareReplay, switchMap, throttleTime
} from "rxjs";
import { modJar } from "./ModrinthApi";
import { selectedFile } from "./State";
import { bytecode, displayLambdas } from "./Settings";
import type { Options } from "./vf";
import type { DecompileResult } from "../workers/decompile/types";
import * as worker from "../workers/decompile/client";
import type { Jar } from "../utils/Jar";
import { classNameFromClassFilePath, internalClassFilePath, type ClassFilePath, type ClassName } from "../utils/Names";
import { browseJar } from "../utils/Jar";

const decompilerCounter = new BehaviorSubject<number>(0);

export const isDecompiling = decompilerCounter.pipe(
    map(count => count > 0),
    distinctUntilChanged()
);

export function getDecompilerOptions(displayLambdas: boolean): Options {
    const options: Options = {};

    if (displayLambdas) {
        options["mark-corresponding-synthetics"] = "1";
    }

    return options;
}

export const currentResult = decompileResultPipeline(modJar);
export function decompileResultPipeline(jar: Observable<{ jar: Jar }>): Observable<DecompileResult> {
    return combineLatest([
        selectedFile,
        jar,
        bytecode.observable,
        displayLambdas.observable,
    ]).pipe(
        distinctUntilChanged(),
        throttleTime(250),
        switchMap(([file, jar, bytecode, displayLambdas]) => {
            if (!file) {
                return of();
            }

            return from(decompileVirtualClass(file, jar.jar, bytecode, displayLambdas));
        }),
        shareReplay({ bufferSize: 1, refCount: false })
    );
}

export async function decompileVirtualClass(file: ClassFilePath, rootJar: Jar, showBytecode = false, lambdas = displayLambdas.value) {
    const classes = (await browseJar(rootJar)).classes;
    const entry = classes.get(file) ?? [...classes.entries()].find(([path]) => internalClassFilePath(path) === file)?.[1];
    if (!entry) return decompileClass(classNameFromClassFilePath(file), rootJar);

    const className = classNameFromClassFilePath(entry.path);
    if (showBytecode) return getClassBytecode(className, entry.jar);

    await worker.setOptions(getDecompilerOptions(lambdas));
    return decompileClass(className, entry.jar);
}

export async function getClassBytecode(className: ClassName, jar: Jar) {
    try {
        decompilerCounter.next(decompilerCounter.value + 1);
        return await worker.getClassBytecode(className, jar);
    } finally {
        decompilerCounter.next(decompilerCounter.value - 1);
    }
}

export async function decompileClass(className: ClassName, jar: Jar) {
    try {
        decompilerCounter.next(decompilerCounter.value + 1);
        return await worker.decompileClass(className, jar);
    } finally {
        decompilerCounter.next(decompilerCounter.value - 1);
    }
}
