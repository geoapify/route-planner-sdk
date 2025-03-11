import { universalFetch } from './tools/fetch';
import { RouteAgent } from "./models/route-agent";
import { RouteJob } from "./models/route-job";
import { RouteShipment } from "./models/route-shipment";
import { RouteLocation } from "./models/route-location";
import { RouteAvoid } from "./models/route-avoid";
import { RoutePlannerResult } from "./models/route-planner-result";

export class RoutePlanner {
    public mode?: string;
    public agents: RouteAgent[] = [];
    public jobs: RouteJob[] = [];
    public shipments: RouteShipment[] = [];
    public locations: RouteLocation[] = [];
    public avoid: RouteAvoid[] = [];
    public traffic?: string;
    public type?: string;
    public max_speed?: number;
    public units?: string;

    constructor(private apiKey: string) {}

    public static async testConnection(apiKey: string): Promise<string> {
        const response = await universalFetch('https://www.geoapify.com/', {
            method: 'GET'
        });
        return response.status === 200 ? "Geoapify is reachable" : "Error";
    }

    public setMode(mode: string): this {
        this.mode = mode;
        return this;
    }

    public addAgent(agent: RouteAgent): this {
        this.agents.push(agent);
        return this;
    }

    public addJob(job: RouteJob): this {
        this.jobs.push(job);
        return this;
    }

    public addLocation(location: RouteLocation): this {
        this.locations.push(location);
        return this;
    }

    public addShipment(shipment: RouteShipment): this {
        this.shipments.push(shipment);
        return this;
    }

    public addAvoid(avoid: RouteAvoid): this {
        this.avoid.push(avoid);
        return this;
    }

    public setTraffic(traffic: string): this {
        this.traffic = traffic;
        return this;
    }

    public setType(type: string): this {
        this.type = type;
        return this;
    }

    public setMaxSpeed(max_speed: number): this {
        this.max_speed = max_speed;
        return this;
    }

    public setUnits(units: string): this {
        this.units = units;
        return this;
    }

    public async plan(): Promise<RoutePlannerResult> {
        const requestBody = {
            mode: this.mode,
            agents: this.agents.length ? this.agents.map(agent => agent.toJSON()) : undefined,
            jobs: this.jobs.length ? this.jobs.map(job => job.toJSON()) : undefined,
            shipments: this.shipments.length ? this.shipments.map(shipment => shipment.toJSON()) : undefined,
            locations: this.locations.length ? this.locations.map(location => location.toJSON()) : undefined,
            avoid: this.avoid.length ? this.avoid.map(avoid => avoid.toJSON()) : undefined,
            traffic: this.traffic,
            type: this.type,
            max_speed: this.max_speed,
            units: this.units,
        };

        const response = await universalFetch(`https://api.geoapify.com/v1/routeplanner?apiKey=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        return await response.json();
    }

}
