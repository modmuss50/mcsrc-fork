import { asyncScheduler, combineLatest, distinctUntilChanged, from, map, Observable, shareReplay, switchMap, throttleTime } from 'rxjs';
import { modJar } from './ModrinthApi';
import { performSearch } from './Search';
import { searchQuery } from './State';
import { isClassFilePath, type ClassFilePath } from '../utils/Names';
import { browseJar } from '../utils/Jar';

export const browsableJar = modJar.pipe(
    switchMap(jar => from(browseJar(jar.jar))),
    shareReplay(1)
);

// File list that only contains outer class files
export const classesList = browsableJar.pipe(
    map(contents => [...contents.classes.entries()]
        .filter(([, entry]) => !entry.path.includes('$'))
        .map(([path]) => path))
);

export const nestedJarList = browsableJar.pipe(
    map(contents => contents.nestedJars)
);

const debouncedSearchQuery: Observable<string> = searchQuery.pipe(
    throttleTime(200, asyncScheduler, { trailing: true }),
    distinctUntilChanged()
);

export const searchResults: Observable<ClassFilePath[]> = combineLatest([classesList, debouncedSearchQuery]).pipe(
    switchMap(([classes, query]) => {
        return [performSearch(query, classes)];
    })
);

export const isSearching = searchQuery.pipe(
    map((query) => query.length > 0)
);
