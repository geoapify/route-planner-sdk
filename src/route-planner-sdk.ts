import { universalFetch } from './tools/fetch';

export class RoutePlannerSDK {
    constructor(private apiKey: string) {}

    public static async testConnection(apiKey: string): Promise<string> {
        const response = await universalFetch('https://www.geoapify.com/', {
            method: 'GET'
        });
        return response.status === 200 ? "Geoapify is reachable" : "Error";
    }

}