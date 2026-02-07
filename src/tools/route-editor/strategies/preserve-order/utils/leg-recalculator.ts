import {LegResponseData, WaypointResponseData} from "../../../../../models";
import {RouteResultEditorBase} from "../../../route-result-editor-base";
import {MISSING_LEG_DATA} from "./leg-builder";

export class LegRecalculator {

    static async fillMissingLegData(context: RouteResultEditorBase, waypoints: WaypointResponseData[],
                                    legs: LegResponseData[]): Promise<void> {
        const missingLegIndices = this.findLegsWithMissingData(legs);

        if (missingLegIndices.length === 0) {
            return;
        }

        const legDataMap = await this.fetchLegDataMap(context, missingLegIndices, legs, waypoints);
        this.applyLegDataFromMap(missingLegIndices, legs, waypoints, legDataMap);
    }

    private static async fetchLegDataMap(context: RouteResultEditorBase, missingLegIndices: number[],
                                         legs: LegResponseData[], waypoints: WaypointResponseData[]): Promise<Map<string, any>> {
        const locations = this.buildLocationList(missingLegIndices, legs, waypoints);

        if (locations.length === 0) {
            return new Map();
        }

        const routingHelper = context.getRoutingHelper();

        try {
            const allLegsData = await routingHelper.calculateLegData(locations);
            return this.buildLegDataMap(locations, allLegsData);
        } catch (error) {
            return new Map();
        }
    }

    private static buildLocationList(missingLegIndices: number[], legs: LegResponseData[],
                                     waypoints: WaypointResponseData[]): [number, number][] {
        const locations: [number, number][] = [];

        for (const legIndex of missingLegIndices) {
            const leg = legs[legIndex];
            const fromWaypoint = waypoints[leg.from_waypoint_index];
            const toWaypoint = waypoints[leg.to_waypoint_index];

            if (fromWaypoint && toWaypoint) {
                locations.push(fromWaypoint.location, toWaypoint.location);
            }
        }

        return locations;
    }

    private static buildLegDataMap(locations: [number, number][], allLegsData: any[]): Map<string, any> {
        const result = new Map<string, any>();

        // We iterate only through even routes.
        // We need P1 -> P2 , P5 -> P6
        // We get P1 -> P2 -> P5 -> P6
        // And skip P2 -> P5
        for (let legDataIndex = 0; legDataIndex < locations.length; legDataIndex += 2) {
            const from = locations[legDataIndex];
            const to = locations[legDataIndex + 1];
            const key = this.getLocationPairKey(from, to);
            result.set(key, allLegsData[legDataIndex]);
        }

        return result;
    }

    private static applyLegDataFromMap(missingLegIndices: number[], legs: LegResponseData[],
                                       waypoints: WaypointResponseData[], legDataMap: Map<string, any>): void {
        for (const legIndex of missingLegIndices) {
            const leg = legs[legIndex];
            const fromWaypoint = waypoints[leg.from_waypoint_index];
            const toWaypoint = waypoints[leg.to_waypoint_index];

            if (!fromWaypoint || !toWaypoint) {
                continue;
            }

            const key = this.getLocationPairKey(fromWaypoint.location, toWaypoint.location);
            const legData = legDataMap.get(key);

            if (legData) {
                leg.time = legData.time || 0;
                leg.distance = legData.distance || 0;
                leg.steps = legData.steps || [];
            } else {
                leg.time = 0;
                leg.distance = 0;
                leg.steps = [];
            }
        }
    }

    private static getLocationPairKey(from: [number, number], to: [number, number]): string {
        return `${from[0]},${from[1]}->${to[0]},${to[1]}`;
    }

    private static findLegsWithMissingData(legs: LegResponseData[]): number[] {
        const missingLegs: number[] = [];

        for (let i = 0; i < legs.length; i++) {
            if (legs[i].time === MISSING_LEG_DATA || legs[i].distance === MISSING_LEG_DATA) {
                missingLegs.push(i);
            }
        }
        return missingLegs;
    }

}

