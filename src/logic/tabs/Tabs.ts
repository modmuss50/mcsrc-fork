import { openTabs, openTab } from "../State";
import { isSupportedImageFilePath } from "../ImageFile";
import { isSupportedTextFilePath } from "../TextFile";
import { isClassFilePath, type ClassFilePath, type JarEntryPath } from "../../utils/Names";
import { Tab } from "./Tab";
import { CodeTab } from "./CodeTab";
import { InheritanceViewTab } from "./InheritanceViewTab";
import { PngFileTab } from "./PngFileTab";
import { TextFileTab } from "./TextFileTab";
import { UnsupportedFileTab } from "./UnsupportedFileTab";

const openTabOfType = <K extends string, T extends Tab>(
    key: K,
    TabClass: new (key: K) => T
) => {
    const existing = openTabs.value.find(
        t => t.key === key && t instanceof TabClass
    ) as T | undefined;

    if (existing) {
        existing.open();
        return;
    }

    new TabClass(key).open();
};

// Looks for tab by key and opens it
export const openUnknownTypeTab = (key: string) => {
    if (openTab.value && openTab.value.key === key) return;
    const existing = openTabs.value.find(t => t.key === key);
    if (!existing) return;
    existing.open();
};

export const openCodeTab = (key: ClassFilePath) => openTabOfType(key, CodeTab);
export const openPngFileTab = (key: JarEntryPath) => openTabOfType(key, PngFileTab);
export const openTextFileTab = (key: JarEntryPath) => openTabOfType(key, TextFileTab);
export const openUnsupportedFileTab = (key: JarEntryPath) => openTabOfType(key, UnsupportedFileTab);
export const openJarEntryTab = (key: JarEntryPath) => {
    if (isClassFilePath(key)) {
        openCodeTab(key);
    } else if (isSupportedImageFilePath(key)) {
        openPngFileTab(key);
    } else if (isSupportedTextFilePath(key)) {
        openTextFileTab(key);
    } else {
        openUnsupportedFileTab(key);
    }
};
export const openInheritanceViewTab = (key: string) => openTabOfType(key, InheritanceViewTab);

export const closeTab = (key: string) => {
    const tab = openTabs.value.find(o => o.key === key);
    tab?.onClose();
    tab?.openLastTabFromHistory();
};

export const setTabPosition = (key: string, placeIndex: number) => {
    const tabs = [...openTabs.value];
    const currentIndex = tabs.findIndex(tab => tab.key === key);
    if (currentIndex === -1) return;
    const currentTab = tabs[currentIndex];

    tabs.splice(currentIndex, 1);

    // Adjust index if moving right
    let index = placeIndex;
    if (placeIndex > currentIndex) index -= 1;

    tabs.splice(index, 0, currentTab);
    openTabs.next(tabs);
};

export const closeOtherTabs = (key: string) => {
    const tab = openTabs.value.find(tab => tab.key === key);
    tab?.closeOtherTabs();
};
