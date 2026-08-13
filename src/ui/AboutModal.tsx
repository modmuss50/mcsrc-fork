import { Modal } from "antd";
import { useObservable } from "../utils/UseObservable";
import { BehaviorSubject } from "rxjs";

export const aboutModalOpen = new BehaviorSubject<boolean>(false);

const AboutModal = () => {
    const isModalOpen = useObservable(aboutModalOpen);

    return (
        <Modal
            title="About modsrc.dev"
            closable
            open={isModalOpen}
            onCancel={() => aboutModalOpen.next(false)}
            footer={null}
        >
            <p>modsrc.dev downloads public mod files directly from Modrinth and decompiles them locally in your browser. Mod files and decompiled source are not uploaded to modsrc.dev.</p>
        </Modal>
    );
};

export default AboutModal;
