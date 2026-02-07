import {ActionResponseData, LegResponseData, PropertiesResponseData, WaypointResponseData} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {LegRecalculator} from "./leg-recalculator";

export class RouteTimeRecalculator {

    static async recalculate(context: RouteResultEditorBase, agentIndex: number): Promise<void> {
        const agentFeature = context.getAgentFeature(agentIndex);
        const properties = agentFeature.properties;

        const actions = properties.actions;
        const waypoints = properties.waypoints;
        const legs = properties.legs || [];

        await LegRecalculator.fillMissingLegData(context, waypoints, legs);

        const legDataMap = this.buildLegDataMap(legs);

        this.recalculateActionTimes(actions, legDataMap);
        this.recalculateWaypointTimes(waypoints, actions);
        this.recalculateAgentTimes(properties, waypoints, legs);
    }

    private static recalculateActionTimes(actions: ActionResponseData[], legDataMap: Map<string, LegResponseData>): void {
        if (actions.length === 0) return;

        let currentTime = actions[0].start_time || 0;

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            action.start_time = currentTime;
            currentTime += action.duration || 0;

            const travelTime = this.getTravelTimeToNextWaypoint(action, actions[i + 1], legDataMap);
            currentTime += travelTime;
        }
    }

    private static getTravelTimeToNextWaypoint(currentAction: ActionResponseData, nextAction: ActionResponseData | undefined,
                                               legDataMap: Map<string, LegResponseData>): number {
        if (!nextAction) {
            return 0;
        }

        const currentWaypointIndex = currentAction.waypoint_index;
        const nextWaypointIndex = nextAction.waypoint_index;

        if (currentWaypointIndex === undefined || nextWaypointIndex === undefined) {
            return 0;
        }
        if (currentWaypointIndex === nextWaypointIndex) {
            return 0;
        }

        const legKey = this.getLegKey(currentWaypointIndex, nextWaypointIndex);
        const leg = legDataMap.get(legKey);
        return leg?.time || 0;
    }

    private static recalculateWaypointTimes(waypoints: WaypointResponseData[], actions: ActionResponseData[]): void {
        for (let i = 0; i < waypoints.length; i++) {
            const waypoint = waypoints[i];
            const waypointActions = actions.filter(a => a.waypoint_index === i);

            if (waypointActions.length > 0) {
                waypoint.start_time = waypointActions[0].start_time;
                waypoint.duration = this.calculateTotalDuration(waypointActions);
            }
        }
    }

    private static recalculateAgentTimes(properties: PropertiesResponseData, waypoints: WaypointResponseData[], legs: LegResponseData[]): void {
        if (waypoints.length === 0) {
            properties.start_time = 0;
            properties.end_time = 0;
            properties.time = 0;
            properties.distance = 0;
            return;
        }

        const firstWaypoint = waypoints[0];
        const lastWaypoint = waypoints[waypoints.length - 1];

        properties.start_time = firstWaypoint.start_time;
        properties.end_time = lastWaypoint.start_time + (lastWaypoint.duration || 0);
        properties.time = properties.end_time - properties.start_time;
        properties.distance = this.calculateTotalDistance(legs);
    }

    private static calculateTotalDistance(legs: LegResponseData[]): number {
        let totalDistance = 0;
        for (const leg of legs) {
            totalDistance += leg.distance || 0;
        }
        return totalDistance;
    }

    private static calculateTotalDuration(actions: ActionResponseData[]): number {
        let totalDuration = 0;
        for (const action of actions) {
            totalDuration += action.duration || 0;
        }
        return totalDuration;
    }

    private static buildLegDataMap(legs: LegResponseData[]): Map<string, LegResponseData> {
        const result = new Map<string, LegResponseData>();
        for (const leg of legs) {
            const key = this.getLegKey(leg.from_waypoint_index, leg.to_waypoint_index);
            result.set(key, leg);
        }
        return result;
    }

    private static getLegKey(fromIndex: number, toIndex: number): string {
        return `${fromIndex}->${toIndex}`;
    }
}


