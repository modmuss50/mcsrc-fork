import { Button, Divider, Flex, Tooltip } from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import { SettingsModalButton } from "./SettingsModal";
import { modSelectionOpen } from "./ModrinthSelector";
import { useObservable } from "../utils/UseObservable";
import { modJar } from "../logic/ModrinthApi";

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
    const selected = useObservable(modJar);

    const downloadSelectedFile = () => {
        if (!selected) return;
        const url = URL.createObjectURL(selected.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = selected.file.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    return (
        <Flex justify="center" align="center" gap={6} style={{ width: "max-content", minWidth: "100%" }}>
            <Tooltip title="Choose a Modrinth mod and release">
                <Button
                    icon={<SearchOutlined />}
                    onClick={() => modSelectionOpen.next(true)}
                >
                    {selected ? `${selected.project.title} · ${selected.version.version_number}` : "Choose mod"}
                </Button>
            </Tooltip>
            <Tooltip title={selected ? `Download ${selected.file.filename} from Modrinth` : "Mod file is loading"}>
                <Button
                    aria-label="Download current mod file"
                    icon={<DownloadOutlined />}
                    disabled={!selected}
                    onClick={downloadSelectedFile}
                />
            </Tooltip>
            <div style={{ flex: "0 0 auto" }}>
                <SettingsModalButton />
            </div>
        </Flex>
    );
};

export default Header;
