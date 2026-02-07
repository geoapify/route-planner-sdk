import { RouteResultEditorBase } from "../../../route-result-editor-base";

/**
 * Placeholder value for legs that need to be calculated by RouteTimeRecalculator.
 */
export const MISSING_LEG_DATA = -1;

export interface WaypointLegIndices {
    prevLegIndex: number | undefined;
    nextLegIndex: number | undefined;
}

export class LegBuilder {

    static insertPlaceholderLeg(context: RouteResultEditorBase, agentIndex: number,
                                waypointIndex: number): WaypointLegIndices {
        const agentFeature = context.getAgentFeature(agentIndex);
        const properties = agentFeature.properties;
        
        if (!properties.legs) {
            properties.legs = [];
        }

        const legs = properties.legs;
        const waypoints = properties.waypoints;

        if (waypoints.length <= 1) {
            return { prevLegIndex: undefined, nextLegIndex: undefined };
        }

        let prevLegIndex: number | undefined;
        let nextLegIndex: number | undefined;

        if (waypointIndex > 0) {
            prevLegIndex = legs.length;
            legs.push({
                from_waypoint_index: waypointIndex - 1,
                to_waypoint_index: waypointIndex,
                time: MISSING_LEG_DATA,
                distance: MISSING_LEG_DATA,
                steps: []
            });
        }

        if (waypointIndex < waypoints.length - 1) {
            nextLegIndex = legs.length;
            legs.push({
                from_waypoint_index: waypointIndex,
                to_waypoint_index: waypointIndex + 1,
                time: MISSING_LEG_DATA,
                distance: MISSING_LEG_DATA,
                steps: []
            });
        }

        return { prevLegIndex, nextLegIndex };
    }
}

