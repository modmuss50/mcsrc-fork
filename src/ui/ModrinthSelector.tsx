import {
    Alert,
    Avatar,
    Button,
    Empty,
    Flex,
    Input,
    List,
    Modal,
    Space,
    Spin,
    Tag,
    Typography,
} from "antd";
import { ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { BehaviorSubject } from "rxjs";
import {
    getModrinthProjectVersions,
    getSelectableVersions,
    searchModrinthProjects,
    type ModrinthProject,
    type SelectableModrinthVersion,
} from "../logic/ModrinthApi";
import { selectModArtifact } from "../logic/State";
import { useObservable } from "../utils/UseObservable";

const { Text, Title } = Typography;
const PAGE_SIZE = 20;

export const modSelectionOpen = new BehaviorSubject(false);

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function ProjectResults({ onSelect }: { onSelect: (project: ModrinthProject) => void }) {
    const [query, setQuery] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState("");
    const [projects, setProjects] = useState<ModrinthProject[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestSequence = useRef(0);

    const search = async (normalized: string, offset: number, signal?: AbortSignal) => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setError(null);
        try {
            const response = await searchModrinthProjects(normalized, offset, PAGE_SIZE, signal);
            if (sequence !== requestSequence.current) return;
            setSubmittedQuery(normalized);
            setProjects(offset === 0 ? response.hits : previous => [...previous, ...response.hits]);
            setTotal(response.total_hits);
        } catch (searchError) {
            if (signal?.aborted || sequence !== requestSequence.current) return;
            setError(searchError instanceof Error ? searchError.message : "Unable to search Modrinth.");
        } finally {
            if (sequence === requestSequence.current) setLoading(false);
        }
    };

    useEffect(() => {
        const normalized = query.trim();
        if (normalized.length < 2) {
            requestSequence.current++;
            setProjects([]);
            setSubmittedQuery("");
            setTotal(0);
            setLoading(false);
            setError(null);
            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(() => void search(normalized, 0, controller.signal), 350);
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query]);

    return (
        <Flex vertical gap={16}>
            <div className="modrinth-search-field">
                <Input
                    allowClear
                    aria-label="Search Modrinth mods"
                    placeholder="Search Modrinth mods"
                    prefix={<SearchOutlined />}
                    suffix={loading ? <Spin size="small" /> : null}
                    size="large"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                />
            </div>
            {error && <Alert type="error" showIcon message={error} />}
            {submittedQuery && (
                <Flex justify="space-between" align="center">
                    <Text type="secondary">{total.toLocaleString()} results for “{submittedQuery}”</Text>
                    <Text type="secondary">Mods only</Text>
                </Flex>
            )}
            <Spin spinning={loading && projects.length === 0} className="modrinth-results-spinner">
                {projects.length > 0 ? (
                    <List
                        className="modrinth-project-list"
                        dataSource={projects}
                        renderItem={project => (
                            <List.Item style={{ paddingInline: 0 }}>
                                <button className="modrinth-project-card" onClick={() => onSelect(project)}>
                                    <Flex gap={12} align="flex-start">
                                        <Avatar className="modrinth-project-icon" crossOrigin="anonymous" shape="square" size={64} src={project.icon_url || undefined}>{project.title[0]}</Avatar>
                                        <Flex vertical gap={2} style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                                            <Flex align="baseline" gap={8} wrap>
                                                <Text strong className="modrinth-project-title">{project.title}</Text>
                                                <Text type="secondary">by {project.author ?? "Unknown author"}</Text>
                                            </Flex>
                                            <Text type="secondary" ellipsis={{ tooltip: project.description }}>{project.description}</Text>
                                            <Space size={[4, 4]} wrap style={{ marginTop: 6 }}>
                                                {project.categories.slice(0, 5).map(category => <Tag key={category}>{category}</Tag>)}
                                            </Space>
                                        </Flex>
                                    </Flex>
                                </button>
                            </List.Item>
                        )}
                    />
                ) : submittedQuery && !loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No mods found for “${submittedQuery}”`} /> : null}
            </Spin>
            {projects.length < total && (
                <Button loading={loading} onClick={() => void search(submittedQuery, projects.length)}>Load more</Button>
            )}
        </Flex>
    );
}

function VersionResults({ project, onBack, onSelect }: {
    project: ModrinthProject;
    onBack: () => void;
    onSelect: () => void;
}) {
    const [versions, setVersions] = useState<SelectableModrinthVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        void getModrinthProjectVersions(project.project_id).then(result => {
            if (active) setVersions(getSelectableVersions(result));
        }).catch(versionError => {
            if (active) setError(versionError instanceof Error ? versionError.message : "Unable to load releases.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [project.project_id]);

    return (
        <Flex vertical gap={12} className="modrinth-version-picker">
            <Flex align="center" gap={8}>
                <Button aria-label="Back to mod search" icon={<ArrowLeftOutlined />} onClick={onBack} />
                <Avatar crossOrigin="anonymous" shape="square" src={project.icon_url || undefined}>{project.title[0]}</Avatar>
                <Title level={4} style={{ margin: 0 }}>{project.title}</Title>
            </Flex>
            {error && <Alert type="error" showIcon message={error} />}
            <Spin spinning={loading}>
                {versions.length > 0 ? (
                    <List className="modrinth-version-list"
                        dataSource={versions}
                        renderItem={version => (
                            <List.Item className="modrinth-version-list-item">
                                <button
                                className="modrinth-version-row"
                                aria-label={`Open ${version.name}`}
                                onClick={() => {
                                    selectModArtifact(project.project_id, version.primaryFile.id);
                                    onSelect();
                                }}
                                >
                                <Flex vertical style={{ width: "100%" }}>
                                    <Flex justify="space-between" gap={12}>
                                        <Text strong>{version.name}</Text>
                                        <Tag color={version.version_type === "release" ? "green" : "gold"}>{version.version_type}</Tag>
                                    </Flex>
                                    <Text type="secondary">{version.version_number} · {version.primaryFile.filename} · {formatBytes(version.primaryFile.size)}</Text>
                                    <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
                                        {version.loaders.map(loader => <Tag key={loader}>{loader}</Tag>)}
                                        {version.game_versions.map(gameVersion => <Tag key={gameVersion}>{gameVersion}</Tag>)}
                                        <Text type="secondary">{new Date(version.date_published).toLocaleDateString()}</Text>
                                    </Space>
                                </Flex>
                                </button>
                            </List.Item>
                        )}
                    />
                ) : !loading && !error ? <Empty description="This project has no primary JAR releases." /> : null}
            </Spin>
        </Flex>
    );
}

export function ModrinthSelector({ onSelect = () => undefined }: { onSelect?: () => void }) {
    const [project, setProject] = useState<ModrinthProject | null>(null);
    return project
        ? <VersionResults project={project} onBack={() => setProject(null)} onSelect={onSelect} />
        : <ProjectResults onSelect={setProject} />;
}

export function ModrinthSelectionModal() {
    const open = useObservable(modSelectionOpen);
    return (
        <Modal
            destroyOnHidden
            footer={null}
            open={open}
            title="Choose a Modrinth mod"
            width={760}
            onCancel={() => modSelectionOpen.next(false)}
        >
            <ModrinthSelector onSelect={() => modSelectionOpen.next(false)} />
        </Modal>
    );
}
