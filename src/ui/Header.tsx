import { Button, Divider, Flex, Tooltip } from "antd";
import { SearchOutlined } from "@ant-design/icons";
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
            <div style={{ flex: "0 0 auto" }}>
                <SettingsModalButton />
            </div>
        </Flex>
    );
};

export default Header;
