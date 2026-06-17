import Editor, { useMonaco } from '@monaco-editor/react';
import { Alert, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { editor } from 'monaco-editor';
import { isDarkMode, isThin } from '../logic/Browser';
import { minecraftJar } from '../logic/MinecraftApi';
import { getTextFileLanguage, readTextFile } from '../logic/TextFile';
import { getOpenTab, TextFileTab } from '../logic/tabs';
import { useObservable } from '../utils/UseObservable';

const IS_ANDROID_CHROME = /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent);

export const TextFile = ({ tab }: { tab: TextFileTab; }) => {
    const monaco = useMonaco();
    const darkMode = useObservable(isDarkMode);
    const hideMinimap = useObservable(isThin);
    const jar = useObservable(minecraftJar);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!monaco) return;
        monaco.editor.setTheme(darkMode ? "vs-dark" : "vs");
    }, [monaco, darkMode]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        if (!jar) return;

        readTextFile(tab.key, jar.jar)
            .then(text => {
                if (cancelled) return;
                setContent(text);
            })
            .catch(e => {
                if (cancelled) return;
                console.error(e);
                setError((e as Error).message);
                setContent("");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [jar, tab.key]);

    if (error) {
        return <Alert type="error" message="Failed to open file" description={error} />;
    }

    return (
        <Spin
            indicator={<LoadingOutlined spin />}
            size={"large"}
            spinning={loading}
            styles={{
                root: {
                    height: '100%',
                    color: 'white'
                },
                container: {
                    height: '100%',
                }
            }}
        >
            <Editor
                value={content}
                language={getTextFileLanguage(tab.key)}
                theme={darkMode ? "vs-dark" : "vs"}
                keepCurrentModel={false}
                options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: !hideMinimap },
                    scrollBeyondLastLine: false,
                    editContext: IS_ANDROID_CHROME ? false : undefined,
                }}
                onMount={(codeEditor: editor.IStandaloneCodeEditor) => {
                    tab.editorRef = codeEditor;
                    if (getOpenTab() === tab) {
                        tab.applyViewToEditor(codeEditor);
                    }
                }}
            />
        </Spin>
    );
};
