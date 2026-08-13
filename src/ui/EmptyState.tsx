import { Alert, Button, Card, Flex, Spin, Typography } from "antd";
import { useObservable } from "../utils/UseObservable";
import { artifactError, modJar } from "../logic/ModrinthApi";
import { classesList } from "../logic/JarFile";
import { selectedModFileId, selectedModProjectId } from "../logic/State";
import { openCodeTab } from "../logic/tabs";
import { ModrinthSelector, modSelectionOpen } from "./ModrinthSelector";
import { SettingsModalButton } from "./SettingsModal";

const { Paragraph, Title } = Typography;

export const EmptyState = () => {
    const projectId = useObservable(selectedModProjectId);
    const fileId = useObservable(selectedModFileId);
    const selectedJar = useObservable(modJar);
    const classes = useObservable(classesList);
    const error = useObservable(artifactError);

    if (!projectId || !fileId) {
        return (
            <div className="modsrc-welcome">
                <div className="modsrc-landing-settings"><SettingsModalButton /></div>
                <Flex vertical gap={18} className="modsrc-landing-content">
                    <div>
                        <Title className="modsrc-title">modsrc.dev</Title>
                        <Paragraph type="secondary" className="modsrc-subtitle">
                            Find a mod on Modrinth and browse its decompiled Java source. Downloads and decompilation happen entirely in your browser.
                        </Paragraph>
                    </div>
                    <Card className="modsrc-search-card" styles={{ body: { padding: 20 } }}><ModrinthSelector /></Card>
                    <Alert
                        type="info"
                        showIcon
                        message="Proof of concept"
                        description="This site is in the proof-of-concept stage. Features, links, and behavior may change."
                    />
                </Flex>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modsrc-welcome">
                <Flex vertical gap={16} style={{ width: "min(680px, calc(100% - 32px))" }}>
                    <Alert type="error" showIcon message="Unable to open this mod" description={error} />
                    <Button type="primary" onClick={() => modSelectionOpen.next(true)}>Choose another mod</Button>
                </Flex>
            </div>
        );
    }

    if (!selectedJar || !classes) {
        return <div className="modsrc-welcome"><Spin size="large" tip="Loading mod JAR" /></div>;
    }

    if (classes.length === 0) {
        return (
            <div className="modsrc-welcome">
                <Alert
                    type="warning"
                    showIcon
                    message="No top-level classes found"
                    description="This JAR may contain only nested JARs. Embedded JARs are not supported yet; choose a different release or mod."
                    action={<Button onClick={() => modSelectionOpen.next(true)}>Choose another</Button>}
                />
            </div>
        );
    }

    const openRandomClass = () => openCodeTab(classes[Math.floor(Math.random() * classes.length)]);
    return (
        <div className="modsrc-welcome">
            <Flex vertical align="center" gap={8}>
                <Title level={3}>{selectedJar.project.title}</Title>
                <Paragraph type="secondary">Select a class from the tree, or open one at random.</Paragraph>
                <Button onClick={openRandomClass}>Open random class</Button>
            </Flex>
        </div>
    );
};
