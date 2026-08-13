import { Button, Flex, Tooltip, Typography } from "antd";
import { getLeftDiff, getRightDiff } from "../../logic/Diff";
import { useObservable } from "../../utils/UseObservable";
import { comparisonSelectionOpen } from "../ComparisonSelectionModal";

const { Text } = Typography;

const DiffVersionSelection = () => {
    const comparison = useObservable(getLeftDiff().jar);
    const current = useObservable(getRightDiff().jar);

    return (
        <Flex align="center" gap={8} style={{ minWidth: 0 }}>
            <Tooltip title={comparison?.file.filename ?? "Choose a comparison release"}>
                <Button size="small" onClick={() => comparisonSelectionOpen.next("left")}>
                    {comparison?.version.version_number ?? "Choose release"}
                </Button>
            </Tooltip>
            <Text type="secondary">vs</Text>
            <Tooltip title={current?.file.filename}>
                <Button size="small" onClick={() => comparisonSelectionOpen.next("right")}>
                    {current?.version.version_number ?? "Choose release"}
                </Button>
            </Tooltip>
        </Flex>
    );
};

export default DiffVersionSelection;
