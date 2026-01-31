import {ReoptimizeOptions, InvalidParameterType} from "../../../models";
import { IndexConverter } from "../../../helpers/index-converter";
import { RequirementHelper } from "../strategies/base/requirement-helper";
import { InsertPositionResolver } from "../strategies/preserve-order/utils/insert-position-resolver";
import { RouteResultEditorBase } from "../route-result-editor-base";

export class AgentReoptimizeHelper {

    static async execute(context: RouteResultEditorBase, options: ReoptimizeOptions): Promise<boolean> {
        if (options.agentIdOrIndex === undefined) {
            throw new InvalidParameterType("agentIdOrIndex is required", "agentIdOrIndex");
        }

        const agentIndex = IndexConverter.convertAgentToIndex(context.getRawData(), options.agentIdOrIndex, true);

        const jobIndexes = this.getItemIndexesToReoptimize(context, agentIndex, options, true);
        const shipmentIndexes = this.getItemIndexesToReoptimize(context, agentIndex, options, false);

        if (jobIndexes.length === 0 && shipmentIndexes.length === 0) {
            return true;
        }

        const inputData = context.cloneInputData();

        RequirementHelper.assignItemsToAgent(inputData.jobs || [], jobIndexes, agentIndex);
        RequirementHelper.assignItemsToAgent(inputData.shipments || [], shipmentIndexes, agentIndex);
        RequirementHelper.markRemainingJobsWithAgentRequirement(context, inputData.jobs || [], jobIndexes);
        RequirementHelper.markRemainingShipmentsWithAgentRequirement(context, inputData.shipments || [], shipmentIndexes);
        context.addAgentCapabilities(inputData.agents);

        return context.executePlan(inputData);
    }

    private static getItemIndexesToReoptimize(context: RouteResultEditorBase, agentIndex: number,
                                              options: ReoptimizeOptions, isJob: boolean): number[] {
        const actions = context.getAgentActions(agentIndex);
        if (actions.length === 0) {
            return [];
        }

        let startActionIndex = 0;
        if (options.afterId) {
            startActionIndex = InsertPositionResolver.findActionPositionById(context, agentIndex, options.afterId) + 1;
        } else if (options.afterWaypointIndex !== undefined) {
            startActionIndex = InsertPositionResolver.validateAndGetWaypointIndex(context, agentIndex, options.afterWaypointIndex) + 1;
        }

        const indexes: number[] = [];
        for (let i = startActionIndex; i < actions.length; i++) {
            const action = actions[i];
            const itemIndex = isJob ? action.job_index : action.shipment_index;
            if (itemIndex !== undefined && !indexes.includes(itemIndex)) {
                indexes.push(itemIndex);
            }
        }

        return indexes;
    }
}

