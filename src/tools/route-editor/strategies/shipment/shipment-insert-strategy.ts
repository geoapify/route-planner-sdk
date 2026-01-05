import { AddAssignOptions } from "../../../../models";
import { 
    AssignStrategy, 
    StrategyContext, 
    RouteEditorHelper, 
    RouteTimeCalculator,
    InsertPositionResolver
} from "../base";

/**
 * Strategy that inserts shipments at optimal or specified position
 * Considers pickup-delivery constraints (pickup must come before delivery)
 */
export class ShipmentInsertStrategy implements AssignStrategy {

    async execute(
        context: StrategyContext,
        agentIndex: number,
        shipmentIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean> {
        RouteEditorHelper.removeShipmentsFromAgents(context, shipmentIndexes);
        
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        
        for (const shipmentIndex of shipmentIndexes) {
            const positions = await this.determineShipmentInsertPositions(context, agentIndex, shipmentIndex, options);
            
            const pickupAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'pickup', positions.pickup);
            const deliveryAction = RouteEditorHelper.createShipmentAction(context, shipmentIndex, 'delivery', positions.delivery);
            
            actions.splice(positions.pickup, 0, pickupAction);
            actions.splice(positions.delivery, 0, deliveryAction);
            
            context.reindexActions(actions);
        }

        await RouteTimeCalculator.recalculateRouteTimes(
            context, 
            agentIndex, 
            RouteTimeCalculator.getShipmentActionLocation
        );
        return true;
    }

    private async determineShipmentInsertPositions(
        context: StrategyContext, 
        agentIndex: number, 
        shipmentIndex: number, 
        options: AddAssignOptions
    ): Promise<{ pickup: number; delivery: number }> {
        if (InsertPositionResolver.hasExplicitInsertPosition(options)) {
            const pickupPosition = InsertPositionResolver.resolveInsertPosition(context, agentIndex, options);
            return { pickup: pickupPosition, delivery: pickupPosition + 1 };
        }
        return await this.findOptimalShipmentPositions(context, agentIndex, shipmentIndex);
    }

    private async findOptimalShipmentPositions(context: StrategyContext, agentIndex: number, shipmentIndex: number): Promise<{ pickup: number; delivery: number }> {
        const shipment = RouteEditorHelper.getShipmentByIndex(context, shipmentIndex);
        const pickupLocation: [number, number] = shipment.pickup!.location!;
        const deliveryLocation: [number, number] = shipment.delivery!.location!;
        
        const agentSolution = context.getResult().getAgentSolutionByIndex(agentIndex);
        if (!agentSolution) {
            return { pickup: 0, delivery: 1 };
        }

        const matrixHelper = context.createMatrixHelper();
        const routeLocations = InsertPositionResolver.extractRouteLocations(agentSolution);

        const pickupIndex = await matrixHelper.findOptimalInsertionPoint(routeLocations, pickupLocation);
        
        const routeWithPickup = [...routeLocations];
        routeWithPickup.splice(pickupIndex, 0, pickupLocation);
        
        const deliveryIndex = await matrixHelper.findOptimalInsertionPoint(
            routeWithPickup.slice(pickupIndex + 1),
            deliveryLocation
        );

        return { 
            pickup: pickupIndex + 1,
            delivery: pickupIndex + 1 + deliveryIndex + 1
        };
    }
}
