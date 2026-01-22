import { RoutePlannerCallOptions } from "../../models/interfaces/route-planner-call-options";
import { RoutingOptions } from '../../models/interfaces/route-planner-input-data';

export interface RouteMatrixSource {
    location: [number, number];
}

export interface RouteMatrixTarget {
    location: [number, number];
}

export interface RouteMatrixEntry {
    distance: number;
    time: number;
    source_index: number;
    target_index: number;
}

export interface RouteMatrixResponse {
    sources: Array<{
        original_location: [number, number];
        location: [number, number];
    }>;
    targets: Array<{
        original_location: [number, number];
        location: [number, number];
    }>;
    sources_to_targets: RouteMatrixEntry[][];
}

/**
 * Helper class for Route Matrix API calls
 * Used to calculate travel times/distances between multiple locations
 */
export class RouteMatrixHelper {
    private baseUrl: string;
    private apiKey: string;
    private mode: string;

    constructor(options: RoutePlannerCallOptions, routingOptions: RoutingOptions) {
        this.baseUrl = options.baseUrl || 'https://api.geoapify.com';
        this.apiKey = options.apiKey;
        this.mode = routingOptions.mode || 'drive'; /* ToDo: use all routing options, keep it in routingOptions, don't create separate properties */
    }

    /**
     * Calculate time/distance matrix between sources and targets
     */
    async calculateMatrix(
        sources: RouteMatrixSource[],
        targets: RouteMatrixTarget[]
    ): Promise<RouteMatrixResponse> {
        const url = `${this.baseUrl}/v1/routematrix?apiKey=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: this.mode,
                sources,
                targets
            })
        });

        if (!response.ok) {
            throw new Error(`Route Matrix API failed: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Calculate travel time from one location to another
     */
    async calculateTravelTime(
        from: [number, number],
        to: [number, number]
    ): Promise<number> {
        const matrix = await this.calculateMatrix(
            [{ location: from }],
            [{ location: to }]
        );

        return matrix.sources_to_targets[0][0].time;
    }

    async findOptimalInsertionPoint(
        route: [number, number][],
        newLocation: [number, number]
    ): Promise<number> {
        if (route.length === 0) return 0;
        if (route.length === 1) return 1;

        const [timesToNew, timesFromNew, consecutiveTimes] = await Promise.all([
            this.calculateTimesToLocation(route, newLocation),
            this.calculateTimesFromLocation(newLocation, route),
            this.calculateConsecutiveTravelTimes(route)
        ]);

        const costs: number[] = [];
        for (let i = 0; i < timesToNew.length; i++) {
            if (i === timesToNew.length - 1) {
                costs.push(timesToNew[i]);
            } else {
                costs.push(timesToNew[i] + timesFromNew[i + 1] - consecutiveTimes[i]);
            }
        }

        const minCost = Math.min(...costs);
        return costs.indexOf(minCost) + 1;
    }

    private async calculateTimesToLocation(
        routeLocations: [number, number][],
        targetLocation: [number, number]
    ): Promise<number[]> {
        const matrix = await this.calculateMatrix(
            this.toMatrixLocations(routeLocations),
            this.toMatrixLocations([targetLocation])
        );
        return matrix.sources_to_targets.map(row => row[0].time);
    }

    private async calculateTimesFromLocation(
        sourceLocation: [number, number],
        routeLocations: [number, number][]
    ): Promise<number[]> {
        const matrix = await this.calculateMatrix(
            this.toMatrixLocations([sourceLocation]),
            this.toMatrixLocations(routeLocations)
        );
        return matrix.sources_to_targets[0].map(entry => entry.time);
    }

    async calculateConsecutiveTravelTimes(routeLocations: [number, number][]): Promise<number[]> {
        if (routeLocations.length < 2) return [];

        const matrix = await this.calculateMatrix(
            this.toMatrixLocations(routeLocations.slice(0, -1)),
            this.toMatrixLocations(routeLocations.slice(1))
        );
        
        return matrix.sources_to_targets.map((row, i) => row[i].time);
    }

    private toMatrixLocations(locations: [number, number][]): RouteMatrixSource[] {
        return locations.map(loc => ({ location: loc }));
    }
}

