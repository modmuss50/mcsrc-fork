import type { editor } from "monaco-editor";
import { selectedFile, tabHistory } from "../State";
import type { JarEntryPath } from "../../utils/Names";
import { Tab } from "./Tab";

export class TextFileTab extends Tab {
    public declare key: JarEntryPath;
    public editorRef: editor.IStandaloneCodeEditor | null = null;
    public viewState: editor.ICodeEditorViewState | null = null;

    public constructor(key: JarEntryPath) {
        super(key);
    }

    public open() {
        super.open();

        if (selectedFile.value !== this.key) {
            selectedFile.next(this.key);
        }
    }

    public onBlur() {
        super.onBlur();
        this.viewState = this.editorRef?.saveViewState() || null;
    }

    public applyViewToEditor(editor: editor.IStandaloneCodeEditor) {
        editor.restoreViewState(this.viewState);
    }

    public openLastTabFromHistory(): void {
        super.openLastTabFromHistory();
        if (tabHistory.value.length > 0) return;
        selectedFile.next(undefined);
    }
}
