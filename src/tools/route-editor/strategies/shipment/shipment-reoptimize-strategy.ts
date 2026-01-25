import { AddAssignOptions } from "../../../../models";
import { AssignStrategy, RequirementHelper } from "../base";
import {RouteResultEditorBase} from "../../route-result-editor-base";

/**
 * Strategy that reoptimizes the entire route when assigning shipments
 */
export class ShipmentReoptimizeStrategy implements AssignStrategy {

    async execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        const inputData = context.cloneInputData();
        
        RequirementHelper.markExistingUnassignedShipments(context, inputData.shipments);
        RequirementHelper.assignItemsToAgent(inputData.shipments, shipmentIndexes, agentIndex);
        RequirementHelper.markRemainingShipmentsWithAgentRequirement(context, inputData.shipments, shipmentIndexes);
        context.addAgentCapabilities(inputData.agents);

        return context.executePlan(inputData);
    }
}
