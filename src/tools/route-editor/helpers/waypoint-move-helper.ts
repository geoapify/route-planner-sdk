import { IndexConverter } from "../../../helpers/index-converter";
import {ActionResponseData, InvalidInsertionPosition} from "../../../models";
import { RouteResultEditorBase } from "../route-result-editor-base";
import { RouteTimeRecalculator, WaypointBuilder } from "../strategies";
import { WaypointResponseData } from "../../../models";

export class WaypointMoveHelper {

    static async execute(context: RouteResultEditorBase, agentIdOrIndex: string | number,
                         fromWaypointIndex: number, toWaypointIndex: number): Promise<void> {
        const agentIndex = IndexConverter.convertAgentToIndex(context.getRawData(), agentIdOrIndex, true);
        context.validateAgent(agentIndex);
        
        const waypoints = context.getAgentWaypoints(agentIndex);
        const actions = context.getAgentActions(agentIndex);

        if (waypoints.length === 0) {
            return;
        }

        this.validateWaypointIndex(waypoints, fromWaypointIndex, agentIndex, 'from');
        this.validateWaypointIndex(waypoints, toWaypointIndex, agentIndex, 'to');

        if (fromWaypointIndex === toWaypointIndex) {
            return;
        }

        const waypointToMove = waypoints[fromWaypointIndex];
        const actionsToMove = [...waypointToMove.actions];

        this.removeWaypointFromList(waypoints, fromWaypointIndex);
        const insertionIndex = this.calculateInsertionIndex(toWaypointIndex, fromWaypointIndex);

        this.removeActionsFromList(actions, actionsToMove);
        this.insertActionsAtPosition(actions, actionsToMove, waypoints, insertionIndex);
        this.insertWaypointAtPosition(waypoints, waypointToMove, insertionIndex);

        this.mergeAdjacentDuplicateLocations(waypoints, insertionIndex);

        context.reindexActions(actions);
        WaypointBuilder.reindexWaypointsActions(waypoints, actions);
        
        await RouteTimeRecalculator.recalculate(context, agentIndex);
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

    private static removeWaypointFromList(waypoints: WaypointResponseData[], index: number): void {
        waypoints.splice(index, 1);
    }

    private static calculateInsertionIndex(toIndex: number, fromIndex: number): number {
        return toIndex > fromIndex ? toIndex - 1 : toIndex;
    }

    private static removeActionsFromList(actions: ActionResponseData[], actionsToRemove: ActionResponseData[]): void {
        for (const actionToRemove of actionsToRemove) {
            const index = actions.findIndex(a => WaypointBuilder.actionsMatch(a, actionToRemove));
            if (index !== -1) {
                actions.splice(index, 1);
            }
        }
    }

   private static insertActionsAtPosition(actions: ActionResponseData[], actionsToInsert: ActionResponseData[],
                                          waypoints: WaypointResponseData[], waypointIndex: number): void {
        const targetActionIndex = this.calculateActionIndexForWaypoint(waypoints, waypointIndex);
        for (let i = 0; i < actionsToInsert.length; i++) {
            actions.splice(targetActionIndex + i, 0, actionsToInsert[i]);
        }
    }

    private static insertWaypointAtPosition(waypoints: WaypointResponseData[], waypoint: WaypointResponseData, index: number): void {
        waypoints.splice(index, 0, waypoint);
    }

    private static calculateActionIndexForWaypoint(waypoints: WaypointResponseData[], waypointIndex: number): number {
        let actionIndex = 0;
        for (let i = 0; i < waypointIndex; i++) {
            actionIndex += waypoints[i].actions.length;
        }
        return actionIndex;
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

