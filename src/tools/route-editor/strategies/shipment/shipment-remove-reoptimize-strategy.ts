import { RemoveOptions } from "../../../../models";
import { RemoveStrategy as IRemoveStrategy, StrategyContext, RequirementHelper } from "../base";

/**
 * Strategy that reoptimizes the route after removing shipments
 */
export class ShipmentRemoveReoptimizeStrategy implements IRemoveStrategy {

    async execute(
        context: StrategyContext,
        shipmentIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        const inputData = context.cloneInputData();
        
        RequirementHelper.markItemsAsUnassigned(inputData.shipments, shipmentIndexes);
        RequirementHelper.markExistingUnassignedShipments(context, inputData.shipments);
        RequirementHelper.markRemainingShipmentsWithAgentRequirement(context, inputData.shipments, shipmentIndexes);
        context.addAgentCapabilities(inputData.agents);

        return context.executePlan(inputData);
    }
}
