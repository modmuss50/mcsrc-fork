import { Empty } from "antd";

export const UnsupportedFile = () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Empty description="Unsupported file" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
);
