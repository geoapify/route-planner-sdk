import {ViolationError} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {RouteEditorHelper} from "../utils/route-editor-helper";
import {InsertPositionResolver} from "../utils/insert-position-resolver";

export class PreserveOrderBaseHelper {
    static addViolationsToResult(rawData: any, violations: ViolationError[]): void {
        if (violations.length === 0) return;

        if (!rawData.properties.agentViolations) {
            rawData.properties.agentViolations = {};
        }

        violations.forEach(violation => {
            const agentIndex = violation.agentIndex;
            if (!rawData.properties.agentViolations![agentIndex]) {
                rawData.properties.agentViolations![agentIndex] = [];
            }
            rawData.properties.agentViolations![agentIndex].push(violation);
        });
    }

    static getEndPosition(context: RouteResultEditorBase, agentIndex: number): number {
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        return context.findEndActionIndex(actions);
    }
}