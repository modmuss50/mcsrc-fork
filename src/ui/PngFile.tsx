import { Alert, Spin, theme } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { readPngFile } from "../logic/ImageFile";
import { minecraftJar } from "../logic/MinecraftApi";
import type { PngFileTab } from "../logic/tabs";
import { useObservable } from "../utils/UseObservable";

export const PngFile = ({ tab }: { tab: PngFileTab; }) => {
    const jar = useObservable(minecraftJar);
    const { token } = theme.useToken();
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;

        setLoading(true);
        setError(null);
        setUrl(null);

        if (!jar) return;

        readPngFile(tab.key, jar.jar)
            .then(blob => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch(e => {
                if (cancelled) return;
                console.error(e);
                setError((e as Error).message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [jar, tab.key]);

    if (error) {
        return <Alert type="error" message="Failed to open image" description={error} />;
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
            <div style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                background: token.colorBgContainer,
                overflow: "auto"
            }}>
                {url && (
                    <img
                        src={url}
                        alt={tab.key}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            imageRendering: "pixelated"
                        }}
                    />
                )}
            </div>
        </Spin>
    );
};
