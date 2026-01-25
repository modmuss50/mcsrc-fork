import { Modal, Progress } from "antd";
import { useObservable } from "../utils/UseObservable";
import { combineLatest, distinctUntilChanged, map } from "rxjs";
import { indexProgress as jarIndexProgress } from "../workers/JarIndex";
import { indexProgress as decompileIndexProgress } from "../logic/Indexer";

const distinctJarIndexProgress = jarIndexProgress.pipe(
    map(Math.round),
    distinctUntilChanged()
);

const combinedIndexProgress = combineLatest([
    distinctJarIndexProgress,
    decompileIndexProgress
]).pipe(
    map(([jarProgress, decompileProgress]) => {
        // If jar indexing is running (>= 0), show that
        if (jarProgress >= 0) {
            return { percent: jarProgress, title: "Indexing Minecraft Jar", subtitle: undefined };
        }
        // If decompile indexing is running (total > 0), show that
        if (decompileProgress.total > 0) {
            const percent = Math.round((decompileProgress.current / decompileProgress.total) * 100);
            return { 
                percent, 
                title: "Decompiling Classes", 
                subtitle: decompileProgress.name.replace('.class', '')
            };
        }
        // Nothing is indexing
        return null;
    }),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
);

const IndexProgressModal = () => {
    const progress = useObservable(combinedIndexProgress);
    const isOpen = progress !== null;

    return (
        <Modal
            title={progress?.title ?? "Indexing"}
            open={isOpen}
            footer={null}
            closable={false}
            width={750}
        >
            {progress?.subtitle && <div>{progress.subtitle}</div>}
            <Progress percent={progress?.percent ?? 0} />
        </Modal>
    );
};

export default IndexProgressModal;
