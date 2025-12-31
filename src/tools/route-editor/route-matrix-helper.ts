import { RoutePlannerOptions } from "../../models/interfaces/route-planner-options";

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

    constructor(options: RoutePlannerOptions, mode: string = 'drive') {
        this.baseUrl = options.baseUrl || 'https://api.geoapify.com';
        this.apiKey = options.apiKey;
        this.mode = mode;
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

    /**
     * Find optimal insertion point for a new location
     * Returns the index where the new location should be inserted
     */
    async findOptimalInsertionPoint(
        route: [number, number][],
        newLocation: [number, number]
    ): Promise<number> {
        if (route.length === 0) {
            return 0;
        }

        if (route.length === 1) {
            return 1; // Insert after the only location
        }

        // Calculate time increase for each possible insertion point
        const insertionCosts: number[] = [];

        for (let i = 0; i < route.length; i++) {
            if (i === route.length - 1) {
                // Insert at end: only need time from last location to new
                const timeToNew = await this.calculateTravelTime(route[i], newLocation);
                insertionCosts.push(timeToNew);
            } else {
                // Insert between i and i+1
                // Cost = time(i → new) + time(new → i+1) - time(i → i+1)
                const matrix = await this.calculateMatrix(
                    [{ location: route[i] }, { location: newLocation }],
                    [{ location: newLocation }, { location: route[i + 1] }]
                );

                const timeItoNew = matrix.sources_to_targets[0][0].time;
                const timeNewToNext = matrix.sources_to_targets[1][1].time;
                const timeItoNext = matrix.sources_to_targets[0][1].time;

                const insertionCost = timeItoNew + timeNewToNext - timeItoNext;
                insertionCosts.push(insertionCost);
            }
        }

        // Find index with minimum cost
        const minCost = Math.min(...insertionCosts);
        return insertionCosts.indexOf(minCost) + 1; // +1 because we insert AFTER this position
    }
}

