import { FolderOpenOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";
import { useState } from "react";
import { agreedEula } from "../logic/Settings";
import { IS_JAVADOC_EDITOR } from "../site";
import { useObservable } from "../utils/UseObservable";
import { needsJavadocDirectory, openJavadocDirectory } from "./JavadocDirectory";

const JavadocDirectoryModal = () => {
    if (!IS_JAVADOC_EDITOR) {
        return (<></>);
    }

    const needsDirectory = useObservable(needsJavadocDirectory);
    const accepted = useObservable(agreedEula.observable);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const handleOpenDirectory = async () => {
        try {
            setLoading(true);
            await openJavadocDirectory();
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            console.error("Failed to open Javadoc directory:", error);
            messageApi.error("Failed to open directory.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Open Javadoc Directory"
            open={needsDirectory && accepted}
            footer={null}
            closable={false}
            mask={{ closable: false }}
        >
            {contextHolder}
            <p style={{ marginBottom: 24 }}>
                Open a local directory to use the Javadoc editor.
            </p>

            <Button
                type="primary"
                icon={<FolderOpenOutlined />}
                size="large"
                block
                loading={loading}
                onClick={handleOpenDirectory}
            >
                Open Directory
            </Button>
        </Modal>
    );
};

export default JavadocDirectoryModal;
