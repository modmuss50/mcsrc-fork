import { selectedFile, tabHistory } from "../State";
import type { JarEntryPath } from "../../utils/Names";
import { Tab } from "./Tab";

export class UnsupportedFileTab extends Tab {
    public declare key: JarEntryPath;

    public constructor(key: JarEntryPath) {
        super(key);
    }

    public open() {
        super.open();

        if (selectedFile.value !== this.key) {
            selectedFile.next(this.key);
        }
    }

    public openLastTabFromHistory(): void {
        super.openLastTabFromHistory();
        if (tabHistory.value.length > 0) return;
        selectedFile.next(undefined);
    }
}
