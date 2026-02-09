import {ActionResponseData, RemoveOptions} from "../../../../models";
import { RemoveStrategy as IRemoveStrategy } from "../base";
import { RouteResultEditorBase } from "../../route-result-editor-base";
import { RouteTimeRecalculator, WaypointBuilder } from "../preserve-order";

/**
 * Strategy that removes shipments while preserving the order of remaining items.
 * Also removes waypoints and rebuilds legs.
 */
export class ShipmentRemovePreserveOrderStrategy implements IRemoveStrategy {

    async execute(
        context: RouteResultEditorBase,
        shipmentIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean> {
        const impactedAgentIndexes = new Set<number>();

        for (const shipmentIndex of shipmentIndexes) {
            const agentIndex = this.removeShipmentFromResult(context, shipmentIndex);
            if (agentIndex !== -1) {
                impactedAgentIndexes.add(agentIndex);
            }
        }

        for (const agentIndex of impactedAgentIndexes) {
            await RouteTimeRecalculator.recalculate(context, agentIndex);
        }

        return true;
    }

    private removeShipmentFromResult(context: RouteResultEditorBase, shipmentIndex: number): number {
        const agentIndex = context.getAgentIndexForShipment(shipmentIndex);
        if (agentIndex === undefined) {
            return -1;
        }

        const feature = context.getAgentFeature(agentIndex);
        const actions = feature.properties.actions;
        const waypoints = feature.properties.waypoints;
        const legs = feature.properties.legs || [];

        const legDataMap = WaypointBuilder.buildLegDataMap(waypoints, legs);

        const filteredActions = actions.filter((action: ActionResponseData) => action.shipment_index !== shipmentIndex);
        feature.properties.actions = filteredActions;
        context.reindexActions(filteredActions);

        WaypointBuilder.removeShipmentActionsFromWaypoints(waypoints, shipmentIndex);
        const updatedWaypoints = WaypointBuilder.removeEmptyWaypoints(waypoints);
        feature.properties.waypoints = updatedWaypoints;

        WaypointBuilder.reindexWaypointsActions(updatedWaypoints, actions);
        feature.properties.legs = WaypointBuilder.rebuildLegs(updatedWaypoints, legDataMap);
        WaypointBuilder.updateWaypointLegIndices(updatedWaypoints);

        this.addToUnassignedShipments(context, shipmentIndex);
        return agentIndex;
    }

    private addToUnassignedShipments(context: RouteResultEditorBase, shipmentIndex: number): void {
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

