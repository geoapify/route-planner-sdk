import { RoutePlannerCallOptions } from "../../../../../models/interfaces/route-planner-call-options";
import { RoutingOptions } from '../../../../../models/interfaces/route-planner-input-data';
import { RoutingApiError } from "../../../../../models";

/**
 * Helper class for Routing API calls to calculate consecutive travel times.
 */
export class RoutingHelper {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly routingOptions: RoutingOptions;

    constructor(options: RoutePlannerCallOptions, routingOptions: RoutingOptions) {
        this.baseUrl = options.baseUrl || 'https://api.geoapify.com';
        this.apiKey = options.apiKey;
        this.routingOptions = routingOptions;
    }

    async calculateConsecutiveTravelTimes(locations: [number, number][]): Promise<number[]> {
        if (locations.length < 2) return [];

        const waypoints = locations.map(loc => `lonlat:${loc[0]},${loc[1]}`).join('|');
        const url = this.constructRoutingUrl(waypoints);

        const response = await fetch(url);

        if (!response.ok) {
            throw new RoutingApiError(
                `Routing API failed: ${response.statusText}`,
                response.status,
                response.statusText
            );
        }

        const result = await response.json();
        const feature = result?.features?.[0];

        if (!feature || !feature.properties?.legs) {
            // No route found, return zeros as fallback
            return new Array(locations.length - 1).fill(0);
        }

        return feature.properties.legs.map((leg: { time: number }) => leg.time);
    }

    async calculateLegData(locations: [number, number][]): Promise<any[]> {
        const routeData = await this.calculateRouteData(locations);
        return routeData.legs;
    }

    async calculateRouteData(locations: [number, number][]): Promise<{ legs: any[]; waypoints: any[] }> {
        if (locations.length < 2) {
            return { legs: [], waypoints: [] };
        }

        const waypoints = locations.map(loc => `lonlat:${loc[0]},${loc[1]}`).join('|');
        const url = this.constructRoutingUrl(waypoints);

        const response = await fetch(url);

        if (!response.ok) {
            throw new RoutingApiError(
                `Routing API failed: ${response.statusText}`,
                response.status,
                response.statusText
            );
        }

        const result = await response.json();
        const feature = result?.features?.[0];

        if (!feature || !feature.properties?.legs) {
            return { legs: [], waypoints: [] };
        }

        return {
            legs: feature.properties.legs || [],
            waypoints: feature.properties.waypoints || []
        };
    }

    constructRoutingUrl(waypoints: string): string {
        let url = `${this.baseUrl}/v1/routing?waypoints=${waypoints}&apiKey=${this.apiKey}`;
        
        if (this.routingOptions.mode) {
            url += `&mode=${this.routingOptions.mode}`;
        }
        if (this.routingOptions.type) {
            url += `&type=${this.routingOptions.type}`;
        }
        if (this.routingOptions.units) {
            url += `&units=${this.routingOptions.units}`;
        }
        if (this.routingOptions.avoid && this.routingOptions.avoid.length > 0) {
            url += `&avoid=${this.routingOptions.avoid.map((a: any) => a.type).join('|')}`;
        }
        if (this.routingOptions.traffic) {
            url += `&traffic=${this.routingOptions.traffic}`;
        }
        if (this.routingOptions.max_speed) {
            url += `&max_speed=${this.routingOptions.max_speed}`;
        }
        
        return url;
    }
}
