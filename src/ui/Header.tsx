import { Divider, Flex, Select, Typography } from "antd";
import { minecraftVersionIds } from "../logic/MinecraftApi";
import { useObservable } from "../utils/UseObservable";
import { SettingsModalButton } from "./SettingsModal";
import { diffView, selectedMinecraftVersion } from "../logic/State";
import { JarDecompilerModalButton } from "./JarDecompilerModal";
import { IS_JAVADOC_EDITOR } from "../site";

const Header = () => {
    return (
        <div>
            <Flex style={{ width: "100%", paddingTop: 8 }}>
                <div style={{ width: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden" }}>
                    <HeaderBody />
                </div>
            </Flex>
            <Divider size="small" />
        </div>
    );
};

const HeaderBody = () => {
    return (
        <Flex justify="center" align="center" gap={6} style={{ width: "max-content", minWidth: "100%" }}>
            {IS_JAVADOC_EDITOR ? <JavadocVersionLabel /> : <VersionSelector />}
            <div style={{ flex: "0 0 auto" }}>
                <JarDecompilerModalButton />
            </div>
            <div style={{ flex: "0 0 auto" }}>
                <SettingsModalButton />
            </div>
        </Flex>
    );
};

const JavadocVersionLabel = () => {
    const currentVersion = useObservable(selectedMinecraftVersion);

    return (
        <Typography.Text style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}>
            {currentVersion ?? "No Minecraft version"}
        </Typography.Text>
    );
};

const VersionSelector = () => {
    const versions = useObservable(minecraftVersionIds);
    const currentVersion = useObservable(selectedMinecraftVersion);

    return (
        <div style={{ display: "grid", flex: "0 0 auto" }}>
            {/* These invisible spans are layered on top of each other in the same grid
                space which auto-sizes the parent to the width of the largest item.
                The Select - taking up 100% of the parent - will then get the width of
                the largest item (>ᴗ•) */}
            {versions?.map(v => (
                <span key={v} style={{
                    gridArea: "1/1",
                    visibility: "hidden",
                    whiteSpace: "nowrap",
                    lineHeight: 0,
                    paddingRight: "42px" // Safety padding for the caret
                }}>{v}</span>
            ))}
            <Select
                style={{ gridArea: "1/1", width: "100%" }}
                value={currentVersion || versions?.[0]}
                onChange={(v) => {
                    if (v == "diff") {
                        diffView.next(true);
                        return;
                    }

                    console.log(`Selected Minecraft version: ${v}`);
                    selectedMinecraftVersion.next(v);
                }}
            >
                <Select.Option key={"diff"} value={"diff"}>Compare</Select.Option>
                {versions?.map(v => (
                    <Select.Option key={v} value={v}>{v}</Select.Option>
                ))}
            </Select>
        </div>
    );
};

export default Header;
