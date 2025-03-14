import { universalFetch } from './tools/fetch';
import {
    Agent,
    RoutePlannerData,
    RoutePlannerResultResponseData,
    TravelMode,
    Job,
    Shipment,
    Location,
    Avoid,
    RoutePlannerError,
    TrafficType,
    DistanceUnitType,
    RouteType
} from "./models";
import { RoutePlannerOptions } from "./models/interfaces/route-planner-options";
import { Utils } from "./tools/utils";
import { RoutePlannerResultConverter } from "./tools/route-planner-result-converter";
import { RoutePlannerResult } from "./models/entities/route-planner-result";

export class RoutePlanner {
    private raw: RoutePlannerData;
    private options: RoutePlannerOptions;

    constructor(options: RoutePlannerOptions,
                raw?: RoutePlannerData) {
        this.options = options;
        if(!this.options.baseUrl) {
            this.options.baseUrl = 'https://api.geoapify.com';
        }
        if(raw) {
            this.raw = raw;
        } else {
            this.raw = {
                agents: [],
                jobs: [],
                shipments: [],
                locations: [],
                avoid: []
            };
        }
    }

    getRaw(): RoutePlannerData {
        return this.raw;
    }

    setRaw(value: RoutePlannerData) {
        this.raw = value;
    }

    public setMode(mode: TravelMode): this {
        this.raw.mode = mode;
        return this;
    }

    public addAgent(agent: Agent): this {
        this.raw.agents.push(agent.getRaw());
        return this;
    }

    public addJob(job: Job): this {
        this.raw.jobs.push(job.getRaw());
        return this;
    }

    public addLocation(location: Location): this {
        this.raw.locations.push(location.getRaw());
        return this;
    }

    public addShipment(shipment: Shipment): this {
        this.raw.shipments.push(shipment.getRaw());
        return this;
    }

    public addAvoid(avoid: Avoid): this {
        this.raw.avoid.push(avoid.getRaw());
        return this;
    }

    public setTraffic(traffic: TrafficType): this {
        this.raw.traffic = traffic;
        return this;
    }

    public setType(type: RouteType): this {
        this.raw.type = type;
        return this;
    }

    public setMaxSpeed(max_speed: number): this {
        this.raw.max_speed = max_speed;
        return this;
    }

    public setUnits(units: DistanceUnitType): this {
        this.raw.units = units;
        return this;
    }

    public async plan(): Promise<RoutePlannerResult> {
        const requestBody = Utils.cleanObject(this.raw);

        const response = await universalFetch(`${this.options.baseUrl}/v1/routeplanner?apiKey=${this.options.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorResponse = await response.json();
            throw new RoutePlannerError(errorResponse.error, errorResponse.message);
        }

        let responseData = await response.json();
        return RoutePlannerResultConverter.convert(this.options, this.getRaw(), responseData);
    }
}
