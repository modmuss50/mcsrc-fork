import { theme } from "antd";
import { useObservable } from "../utils/UseObservable";
import { selectedFile } from "../logic/State";
import { withoutClassExtension } from "../utils/Names";

export const FilepathHeader = () => {
    const { token } = theme.useToken();
    const info = useObservable(selectedFile);

    return info && (
        <div style={{
            display: "flex",
            width: "100%",
            boxSizing: "border-box",
            alignItems: "center",
            justifyContent: "left",
            padding: ".25rem 1rem",
            fontFamily: token.fontFamily,
        }}>
            <div style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                direction: "rtl",
                color: token.colorText
            }}>
                {withoutClassExtension(info).split("/").map((path, i, arr) => (
                    <span key={path}>
                        <span style={{ color: i < arr.length - 1 ? token.colorTextTertiary : token.colorText }}>{path}</span>
                        {i < arr.length - 1 && <span style={{ color: token.colorTextTertiary }}>/</span>}
                    </span>
                ))}
            </div>
        </div>
    );
};
