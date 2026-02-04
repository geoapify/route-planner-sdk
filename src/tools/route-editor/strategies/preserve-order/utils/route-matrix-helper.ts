import { RoutePlannerCallOptions } from "../../../../../models/interfaces/route-planner-call-options";
import { RoutingOptions } from '../../../../../models/interfaces/route-planner-input-data';
import { RouteMatrixApiError } from "../../../../../models";

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
 * Helper class for Route Matrix API calls.
 * Used for 1→N and N→1 travel time calculations when finding optimal insertion points.
 */
export class RouteMatrixHelper {
    private baseUrl: string;
    private apiKey: string;
    private routingOptions: RoutingOptions;


    constructor(options: RoutePlannerCallOptions, routingOptions: RoutingOptions) {
        this.baseUrl = options.baseUrl || 'https://api.geoapify.com';
        this.apiKey = options.apiKey;
        this.routingOptions = routingOptions;
    }

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
                mode: this.routingOptions.mode || 'drive',
                type: this.routingOptions.type,
                avoid: this.routingOptions.avoid,
                traffic: this.routingOptions.traffic,
                max_speed: this.routingOptions.max_speed,
                units: this.routingOptions.units,
                sources,
                targets
            })
        });

        if (!response.ok) {
            throw new RouteMatrixApiError(
                `Route Matrix API failed: ${response.statusText}`,
                response.status,
                response.statusText
            );
        }

        return await response.json();
    }

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

    async calculateTimesToLocation(
        routeLocations: [number, number][],
        targetLocation: [number, number]
    ): Promise<number[]> {
        const matrix = await this.calculateMatrix(
            this.toMatrixLocations(routeLocations),
            this.toMatrixLocations([targetLocation])
        );
        return matrix.sources_to_targets.map(row => row[0].time);
    }

    async calculateTimesFromLocation(
        sourceLocation: [number, number],
        routeLocations: [number, number][]
    ): Promise<number[]> {
        const matrix = await this.calculateMatrix(
            this.toMatrixLocations([sourceLocation]),
            this.toMatrixLocations(routeLocations)
        );
        return matrix.sources_to_targets[0].map(entry => entry.time);
    }

    private toMatrixLocations(locations: [number, number][]): RouteMatrixSource[] {
        return locations.map(loc => ({ location: loc }));
    }
}

