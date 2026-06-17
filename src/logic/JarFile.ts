import { BehaviorSubject, combineLatest, distinct, distinctUntilChanged, map, Observable, switchMap, throttleTime } from 'rxjs';
import { minecraftJar } from './MinecraftApi';
import { performSearch } from './Search';
import { searchQuery } from './State';
import { showAllFiles } from './Settings';
import { isClassFilePath, toJarEntryPath, type ClassFilePath, type JarEntryPath } from '../utils/Names';

export const fileList: Observable<JarEntryPath[]> = minecraftJar.pipe(
    distinctUntilChanged(),
    map(jar => Object.keys(jar.jar.entries).map(toJarEntryPath))
);

// File list that only contains outer class files
export const classesList = fileList.pipe(
    map(files => files.filter((file): file is ClassFilePath => isClassFilePath(file) && !file.includes('$')))
);

export const displayFileList: Observable<JarEntryPath[]> = combineLatest([
    fileList,
    classesList,
    showAllFiles.observable
]).pipe(
    map(([files, classes, showAll]) => showAll ? files.filter(file => !file.endsWith('/')) : classes)
);

const debouncedSearchQuery: Observable<string> = searchQuery.pipe(
    throttleTime(200),
    distinctUntilChanged()
);

export const searchResults: Observable<JarEntryPath[]> = combineLatest([displayFileList, debouncedSearchQuery]).pipe(
    switchMap(([files, query]) => {
        return [performSearch(query, files)];
    })
);

export const isSearching = searchQuery.pipe(
    map((query) => query.length > 0)
);
