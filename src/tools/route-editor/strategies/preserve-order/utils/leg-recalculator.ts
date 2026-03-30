import {FeatureResponseData, RouteLegData, WaypointData} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";

export const MISSING_LEG_DATA = -1;

export interface WaypointLegIndices {
    prevLegIndex: number | undefined;
    nextLegIndex: number | undefined;
}
export class LegRecalculator {

    static replaceLegsForInsertedWaypoint(context: RouteResultEditorBase, agentIndex: number,
                                          waypointIndex: number) {
        const agentFeature = context.getAgentFeature(agentIndex);
        const properties = agentFeature.properties;
        
        if (!properties.legs) {
            properties.legs = [];
        }

        const legs = properties.legs;
        const waypoints = properties.waypoints;

        const leg1 = {
            from_waypoint_index: waypointIndex - 1,
            to_waypoint_index: waypointIndex,
            time: MISSING_LEG_DATA,
            distance: MISSING_LEG_DATA,
            steps: []
        }

        const leg2 = {
            from_waypoint_index: waypointIndex,
            to_waypoint_index: waypointIndex + 1,
            time: MISSING_LEG_DATA,
            distance: MISSING_LEG_DATA,
            steps: []
        }        

        if (waypoints.length <= 1) {
            // do nothing, no legs
            return;
        }

        if (waypointIndex === 0) {
            legs.splice(waypointIndex, 0, leg2);
        } else if (waypointIndex === waypoints.length - 1) {
            legs.splice(waypointIndex, 0, leg1);
        } else {
            // Middle insertion, first remove the existing leg and add 2
            legs.splice(waypointIndex - 1, 1, leg1, leg2);
        }

        // reindex waypoints
        legs.forEach((leg, index) => {
            leg.from_waypoint_index = index;
            leg.to_waypoint_index = index + 1;
        });
    }

    static async fillMissingLegData(context: RouteResultEditorBase, agentFeature: FeatureResponseData): Promise<void> {
        const waypoints = agentFeature.properties.waypoints || [];
        const legs = agentFeature.properties.legs || [];

        const missingLegIndices = this.findMissingLegIndices(legs);
        if (missingLegIndices.length > 0) {
            await this.fillMissingOrderedLegs(context, waypoints, legs, missingLegIndices);
        }

        this.recreateGeometry(agentFeature, waypoints, legs);
    }

    private static async fillMissingOrderedLegs(
        context: RouteResultEditorBase,
        waypoints: WaypointData[],
        legs: RouteLegData[],
        missingLegIndices: number[]
    ): Promise<void> {
        const routingHelper = context.getRoutingHelper();
        const routeResults = await Promise.all(
            missingLegIndices.map(async (legIndex) => {
                const fromWaypoint = waypoints[legIndex];
                const toWaypoint = waypoints[legIndex + 1];
                const fromLocation = this.getWaypointLocation(fromWaypoint);
                const toLocation = this.getWaypointLocation(toWaypoint);

                if (!fromLocation || !toLocation) {
                    return { legIndex, routeData: null };
                }

                try {
                    const routeData = await routingHelper.calculateRouteData([fromLocation, toLocation]);
                    return { legIndex, routeData };
                } catch (_error) {
                    return { legIndex, routeData: null };
                }
            })
        );

        for (const result of routeResults) {
            const leg = legs[result.legIndex];
            if (!leg) {
                continue;
            }

            const routeLeg = result.routeData?.legs?.[0];
            if (routeLeg) {
                leg.time = routeLeg.time ?? 0;
                leg.distance = routeLeg.distance ?? 0;
                leg.steps = [{
                    distance: leg.distance,
                    time: routeLeg.time,
                    from_index: 0,
                    to_index: 1
                }];
            } else {
                leg.time = 0;
                leg.distance = 0;
                leg.steps = [];
            }

            const fromLocation = this.getMappedRouteWaypointLocation(result.routeData?.waypoints, 0);
            const toLocation = this.getMappedRouteWaypointLocation(result.routeData?.waypoints, 1);
            if (fromLocation) {
                waypoints[result.legIndex].location = fromLocation;
            }
            if (toLocation) {
                waypoints[result.legIndex + 1].location = toLocation;
            }
        }
    }

    private static recreateGeometry(
        agentFeature: FeatureResponseData,
        waypoints: WaypointData[],
        legs: RouteLegData[]
    ): void {
        const coordinates: [number, number][][] = [];

        for (let i = 0; i < legs.length; i++) {
            const fromLocation = this.getWaypointLocation(waypoints[i]);
            const toLocation = this.getWaypointLocation(waypoints[i + 1]);
            if (!fromLocation || !toLocation) {
                continue;
            }

            legs[i].from_waypoint_index = i;
            legs[i].to_waypoint_index = i + 1;
            coordinates.push([fromLocation, toLocation]);
        }

        agentFeature.geometry = {
            ...agentFeature.geometry,
            type: "MultiLineString",
            coordinates
        };
    }

    private static getMappedRouteWaypointLocation(
        routeWaypoints: any[] | undefined,
        originalIndex: number
    ): [number, number] | undefined {
        if (!routeWaypoints || routeWaypoints.length === 0) {
            return undefined;
        }

        const mappedWaypoint = routeWaypoints.find((waypoint: any) => waypoint?.original_index === originalIndex);
        return mappedWaypoint?.location || routeWaypoints[originalIndex]?.location;
    }

    private static getWaypointLocation(waypoint: WaypointData | undefined): [number, number] | undefined {
        if (!waypoint) {
            return undefined;
        }
        return waypoint.location || waypoint.original_location;
    }

    private static findMissingLegIndices(legs: RouteLegData[]): number[] {
        const missingLegs: number[] = [];
        for (let i = 0; i < legs.length; i++) {
            const leg = legs[i];
            if (!leg) {
                continue;
            }

            if (leg.time === undefined || leg.time === MISSING_LEG_DATA || leg.time < 0 ||
                leg.distance === undefined || leg.distance === MISSING_LEG_DATA || leg.distance < 0) {
                missingLegs.push(i);
            }
        }
        return missingLegs;
    }
}
