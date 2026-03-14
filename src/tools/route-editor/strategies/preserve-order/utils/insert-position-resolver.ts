import {
    AddAssignOptions,
    FeatureResponseData, InvalidInsertionPosition
} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";

/**
 * Shared helper for resolving insert positions
 */
export class InsertPositionResolver {

    static hasExplicitInsertPosition(options: AddAssignOptions): boolean {
        return ((options.afterId !== undefined && options.afterId !== '') ||
                options.afterWaypointIndex !== undefined) &&
               options.append === true;
    }

    static shouldAppend(options: AddAssignOptions): boolean {
        return options.append === true &&
               !options.afterId && 
               options.afterWaypointIndex === undefined;
    }

    static resolveInsertPosition(options: AddAssignOptions): number {
        
        if (options.afterWaypointIndex !== undefined) {
            return options.afterWaypointIndex + 1;
        }

        return 0;
    }

    static validateAfterWaypointIndex(context: RouteResultEditorBase, agentIndex: number, waypointIndex: number): void {
        const waypoints = context.getAgentWaypoints(agentIndex);
        const lastWaypointIndex = waypoints.length - 1;

        if (waypoints.length === 0) {
            throw new InvalidInsertionPosition(`Agent ${agentIndex} has no route.`, agentIndex);
        }

        if (waypointIndex < 0 || waypointIndex >= waypoints.length) {
            throw new InvalidInsertionPosition(
                `Waypoint index ${waypointIndex} out of range (0-${waypoints.length - 1})`,
                agentIndex,
                waypointIndex
            );
        }

        if (waypointIndex === lastWaypointIndex && waypoints[lastWaypointIndex].actions.some(action => action.type === 'end')) {
            throw new InvalidInsertionPosition(
                `Cannot change the route after waypoint ${waypointIndex} (end location).`,
                agentIndex,
                waypointIndex
            );
        }
    }

    static extractRouteLocations(agentFeature: FeatureResponseData): [number, number][] {
        return agentFeature.properties.waypoints
            .map(waypoint => waypoint.location || waypoint.original_location);
    }
}
