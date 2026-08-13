import { Modal } from "antd";
import { BehaviorSubject } from "rxjs";
import { modJar } from "../logic/ModrinthApi";
import { comparisonModJar } from "../logic/Diff";
import { diffComparisonFileId, diffView, selectedFile, selectedModFileId } from "../logic/State";
import { useObservable } from "../utils/UseObservable";
import { VersionResults } from "./ModrinthSelector";

export type ComparisonSide = "left" | "right";
export const comparisonSelectionOpen = new BehaviorSubject<ComparisonSide | null>(null);

const ComparisonSelectionModal = () => {
    const side = useObservable(comparisonSelectionOpen);
    const current = useObservable(modJar);
    const comparison = useObservable(comparisonModJar);
    const reference = side === "right" ? comparison : current;
    const excludedFile = side === "right" ? comparison?.file.id : current?.file.id;

    return (
        <Modal
            destroyOnHidden
            footer={null}
            open={!!side && !!current}
            title={`Choose the ${side ?? "comparison"} release`}
            width={760}
            onCancel={() => comparisonSelectionOpen.next(null)}
        >
            {current && (
                <VersionResults
                    project={current.project}
                    excludeFileId={excludedFile}
                    matchVersion={reference?.version}
                    allowPlatformFilter
                    onSelect={version => {
                        selectedFile.next(undefined);
                        if (side === "right") {
                            selectedModFileId.next(version.primaryFile.id);
                        } else {
                            diffComparisonFileId.next(version.primaryFile.id);
                        }
                        diffView.next(true);
                        comparisonSelectionOpen.next(null);
                    }}
                />
            )}
        </Modal>
    );
};

export default ComparisonSelectionModal;
