import { enableTabs } from "../Settings";
import { openTab, openTabs, tabHistory } from "../State";

export abstract class Tab {
    public key: string;

    public constructor(key: string) {
        this.key = key;
    }

    public open() {
        if (openTab.value && openTab.value.key === this.key) return;
        const activeTab = getOpenTab();
        activeTab?.onBlur();

        if (enableTabs.value) {
            const tabs = [...openTabs.value];
            let openTabIndex = -1;
            if (openTab.value != null) {
                openTabIndex = tabs.findIndex(t => t.key === openTab.value?.key);
            }

            if (!tabs.some(tab => tab.key === this.key)) {
                const insertIndex = openTabIndex >= 0 ? openTabIndex + 1 : tabs.length;
                tabs.splice(insertIndex, 0, this);
                openTabs.next(tabs);
            }
        } else {
            openTabs.next([this]);
        }

        this.pushToTabHistory();
        openTab.next(this);
    }

    public onClose() {
        openTabs.next(openTabs.value.filter(t => t.key !== this.key));

        if (openTabs.value.length === 0) {
            openTab.next(null);
        }

        this.removeFromTabHistory();
    }

    protected onBlur() { }

    protected pushToTabHistory() {
        if (tabHistory.value.length < 50) {
            tabHistory.next([...tabHistory.value, this.key]);
        }
    }

    protected removeFromTabHistory() {
        tabHistory.next(tabHistory.value.filter(v => v != this.key));
    }

    public openLastTabFromHistory() {
        const lastTabKeyFromHistory = tabHistory.value.length > 0 ?
            tabHistory.value[tabHistory.value.length - 1] : null;

        let tab = openTabs.value.find(t => t.key === lastTabKeyFromHistory);

        if (!tab) tab = openTabs.value[0];
        tab?.open();
    }

    public closeOtherTabs() {
        openTabs.value.forEach(t => {
            if (t.key !== this.key) t.onClose();
        });

        openTabs.value.find(t => t.key === this.key)?.open();
    }
}

export const getOpenTab = <T extends Tab>(): T | null => {
    return openTab.value as T | null;
};
