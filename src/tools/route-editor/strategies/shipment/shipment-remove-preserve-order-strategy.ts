import {ActionResponseData, RemoveOptions} from "../../../../models";
import { RemoveStrategy as IRemoveStrategy } from "../base";
import { RouteResultEditorBase } from "../../route-result-editor-base";
import { AgentPlanRecalculator, WaypointBuilder } from "../preserve-order";
import { RouteViolationValidator } from "../preserve-order/validations";

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
            await AgentPlanRecalculator.recalculate(context, agentIndex);
            RouteViolationValidator.validate(context, agentIndex);
        }

        return true;
    }

    private removeShipmentFromResult(context: RouteResultEditorBase, shipmentIndex: number): number {
        const agentIndex = context.getAgentIndexForShipment(shipmentIndex);
        if (agentIndex === undefined) {
            return -1;
        }

        const feature = context.getAgentFeature(agentIndex);
        const waypoints = feature.properties.waypoints;
        const legs = feature.properties.legs || [];

        WaypointBuilder.removeShipmentActionsFromWaypoints(waypoints, shipmentIndex);
        const legDataMap = WaypointBuilder.buildLegDataMap(waypoints, legs);
        const cleanupResult = WaypointBuilder.removeEmptyWaypoints(waypoints, legDataMap);
        feature.properties.waypoints = cleanupResult.waypoints;
        if (cleanupResult.legs) {
            feature.properties.legs = cleanupResult.legs;
        }

        return agentIndex;
    }
}
