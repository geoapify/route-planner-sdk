import { IndexConverter } from "../../../helpers/index-converter";
import { ActionResponseData, InvalidInsertionPosition } from "../../../models";
import { RouteResultEditorBase } from "../route-result-editor-base";
import { AgentPlanRecalculator, WaypointBuilder } from "../strategies";
import { WaypointResponseData } from "../../../models";
import { RouteViolationValidator } from "../strategies/preserve-order/validations";

export class WaypointMoveHelper {

    static async execute(context: RouteResultEditorBase, agentIdOrIndex: string | number,
                         fromWaypointIndex: number, toWaypointIndex: number): Promise<void> {
        const agentIndex = IndexConverter.convertAgentToIndex(context.getRawData(), agentIdOrIndex, true);
        context.validateAgent(agentIndex);
        
        const agentFeature = context.getAgentFeature(agentIndex);
        const waypoints = agentFeature.properties.waypoints;
        const actions = agentFeature.properties.actions;

        if (waypoints.length === 0) {
            return;
        }

        this.validateWaypointIndex(waypoints, fromWaypointIndex, agentIndex, 'from');
        this.validateWaypointIndex(waypoints, toWaypointIndex, agentIndex, 'to');
        this.validatePickupDeliveryOrder(waypoints, fromWaypointIndex, toWaypointIndex, agentIndex);

        if (fromWaypointIndex === toWaypointIndex) {
            return;
        }

        const existingLegs = agentFeature.properties.legs || [];
        const legDataMap = WaypointBuilder.buildLegDataMap(waypoints, existingLegs);

        const waypointToMove = waypoints[fromWaypointIndex];
        waypoints.splice(fromWaypointIndex, 1);
        waypoints.splice(toWaypointIndex, 0, waypointToMove);

        this.mergeAdjacentDuplicateLocations(waypoints, toWaypointIndex);
        
        agentFeature.properties.legs = WaypointBuilder.rebuildLegs(waypoints, legDataMap);
        await AgentPlanRecalculator.recalculate(context, agentIndex);
        
        RouteViolationValidator.validate(context, agentIndex);
    }

    private static validateWaypointIndex(waypoints: WaypointResponseData[], index: number, agentIndex: number, label: string): void {
        if (index < 0 || index >= waypoints.length) {
            throw new InvalidInsertionPosition(`Waypoint ${label} index ${index} out of range (0-${waypoints.length - 1})`, agentIndex, index);
        }

        const waypoint = waypoints[index];
        const isStartOrEnd = waypoint.actions.some(action => action.type === 'start' || action.type === 'end');
        if (isStartOrEnd) {
            throw new InvalidInsertionPosition(`Cannot move waypoint containing start or end action (index ${index})`, agentIndex, index);
        }
    }

    private static validatePickupDeliveryOrder(
        waypoints: WaypointResponseData[],
        fromWaypointIndex: number,
        toWaypointIndex: number,
        agentIndex: number
    ): void {
        const fromWaypoint = waypoints[fromWaypointIndex];
        const shipmentIndexes = new Set<number>();

        for (const action of fromWaypoint.actions) {
            if (typeof action.shipment_index === "number") {
                shipmentIndexes.add(action.shipment_index);
            }
        }

        if (shipmentIndexes.size === 0) {
            return;
        }

        for (const shipmentIndex of shipmentIndexes) {
            let pickupWaypointIndex = -1;

            for (let waypointIndex = 0; waypointIndex < waypoints.length; waypointIndex++) {
                const hasPickup = waypoints[waypointIndex].actions.some(
                    (action: ActionResponseData) =>
                        action.type === "pickup" && action.shipment_index === shipmentIndex
                );

                if (hasPickup) {
                    pickupWaypointIndex = waypointIndex;
                    break;
                }
            }

            if (pickupWaypointIndex !== -1 && pickupWaypointIndex >= toWaypointIndex) {
                throw new InvalidInsertionPosition(
                    `Cannot move waypoint ${fromWaypointIndex} before pickup for shipment ${shipmentIndex}`,
                    agentIndex,
                    toWaypointIndex
                );
            }
        }
    }


    private static mergeAdjacentDuplicateLocations(waypoints: WaypointResponseData[], movedIndex: number): void {
        const hasPreviousMatch = movedIndex > 0 &&
            this.haveSameLocation(waypoints[movedIndex - 1], waypoints[movedIndex]);

        const hasNextMatch = movedIndex < waypoints.length - 1 &&
            this.haveSameLocation(waypoints[movedIndex], waypoints[movedIndex + 1]);

        if (hasPreviousMatch) {
            this.mergeWaypoints(waypoints, movedIndex - 1, movedIndex);
        } else if (hasNextMatch) {
            this.mergeWaypoints(waypoints, movedIndex, movedIndex + 1);
        }
    }

    private static haveSameLocation(firstWaypoint: WaypointResponseData, secondWaypoint: WaypointResponseData): boolean {
        if (firstWaypoint.original_location_index !== undefined && secondWaypoint.original_location_index !== undefined) {
            return firstWaypoint.original_location_index === secondWaypoint.original_location_index;
        }

        const [lat1, lon1] = firstWaypoint.original_location;
        const [lat2, lon2] = secondWaypoint.original_location;
        return lat1 === lat2 && lon1 === lon2;
    }

    private static mergeWaypoints(waypoints: WaypointResponseData[], keepIndex: number, removeIndex: number): void {
        const keepWaypoint = waypoints[keepIndex];
        const removeWaypoint = waypoints[removeIndex];

        keepWaypoint.actions.push(...removeWaypoint.actions);
        keepWaypoint.duration += removeWaypoint.duration;

        waypoints.splice(removeIndex, 1);
    }
}
