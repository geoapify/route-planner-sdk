import { AddAssignOptions } from "../../../../models";
import { 
    AssignStrategy, 
    StrategyContext, 
    ActionFactory, 
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
        const agentFeature = context.getAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        const endActionIndex = context.findEndActionIndex(actions);
        
        for (const shipmentIndex of shipmentIndexes) {
            const pickupAction = ActionFactory.createShipmentAction(context, shipmentIndex, 'pickup', endActionIndex);
            const deliveryAction = ActionFactory.createShipmentAction(context, shipmentIndex, 'delivery', endActionIndex + 1);
            
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
