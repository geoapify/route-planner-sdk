import { AddAssignOptions } from "../../../../models";
import { 
    AssignStrategy, 
    StrategyContext, 
    RouteEditorHelper, 
    RouteTimeCalculator 
} from "../base";

/**
 * Strategy that appends shipments to the end of agent's route without reoptimization
 */
export class ShipmentAppendStrategy implements AssignStrategy {

    async execute(
        context: StrategyContext,
        agentIndex: number,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        RouteEditorHelper.removeShipmentsFromAgents(context, shipmentIndexes);
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        const endActionIndex = context.findEndActionIndex(actions);
        
        for (const shipmentIndex of shipmentIndexes) {
            const pickupAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'pickup', endActionIndex);
            const deliveryAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'delivery', endActionIndex + 1);
            
            actions.splice(endActionIndex, 0, pickupAction, deliveryAction);
            context.reindexActions(actions);
        }

        await RouteTimeCalculator.recalculateRouteTimes(
            context, 
            agentIndex, 
            RouteTimeCalculator.getShipmentActionLocation
        );
        return true;
    }
}
