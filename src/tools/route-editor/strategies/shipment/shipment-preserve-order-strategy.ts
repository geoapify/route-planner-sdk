import { RemoveOptions } from "../../../../models";
import { RemoveStrategy as IRemoveStrategy, StrategyContext } from "../base";

/**
 * Strategy that removes shipments while preserving the order of remaining items
 */
export class ShipmentPreserveOrderStrategy implements IRemoveStrategy {

    async execute(
        context: StrategyContext,
        shipmentIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        for (const shipmentIndex of shipmentIndexes) {
            this.removeShipmentFromResult(context, shipmentIndex);
        }
        return true;
    }

    private removeShipmentFromResult(context: StrategyContext, shipmentIndex: number): void {
        const rawData = context.getRawData();
        
        for (const feature of rawData.features) {
            const actions = feature.properties.actions;
            
            // Remove all actions for this shipment (pickup + delivery)
            const actionsToRemove = actions
                .map((a: any, idx: number) => ({ action: a, originalIdx: idx }))
                .filter((item: any) => item.action.shipment_index === shipmentIndex);
            
            if (actionsToRemove.length > 0) {
                // Remove in reverse order to preserve indexes
                for (let i = actionsToRemove.length - 1; i >= 0; i--) {
                    actions.splice(actionsToRemove[i].originalIdx, 1);
                }
                
                context.reindexActions(actions);
                this.addToUnassignedShipments(context, shipmentIndex);
                break;
            }
        }
    }

    private addToUnassignedShipments(context: StrategyContext, shipmentIndex: number): void {
        const rawData = context.getRawData();
        if (!rawData.properties.issues) {
            rawData.properties.issues = {};
        }
        const issues = rawData.properties.issues;
        if (!issues.unassigned_shipments) {
            issues.unassigned_shipments = [];
        }
        if (!issues.unassigned_shipments.includes(shipmentIndex)) {
            issues.unassigned_shipments.push(shipmentIndex);
        }
    }
}

