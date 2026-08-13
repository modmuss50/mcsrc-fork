import { Modal, Progress } from "antd";
import { downloadProgress } from "../logic/ModrinthApi";
import { useObservable } from "../utils/UseObservable";

const ProgressModal = () => {
    const download = useObservable(downloadProgress);
    const progress = download;

    return (
        <Modal
            title="Downloading Mod JAR"
            open={progress !== undefined}
            footer={null}
            closable={false}
        >
            <Progress percent={progress ?? 0} />
        </Modal>
    );
};

export default ProgressModal;
