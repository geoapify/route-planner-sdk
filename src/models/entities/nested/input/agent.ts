import { Break } from "./break";
import { AgentData } from "../../../interfaces";

export class Agent {
    private raw: AgentData;

    constructor(raw?: AgentData) {
        if (raw) {
            this.raw = raw;
        } else {
            this.raw = {
                capabilities: [],
                time_windows: [],
                breaks: []
            };
        }
    }

    getRaw(): AgentData {
        return this.raw;
    }

    setRaw(value: AgentData): this {
        this.raw = value;
        return this;
    }

    public setStartLocation(lon: number, lat: number): this {
        this.raw.start_location = [lon, lat];
        return this;
    }

    public setStartLocationIndex(value: number): this {
        this.raw.start_location_index = value;
        return this;
    }

    public setEndLocation(lon: number, lat: number): this {
        this.raw.end_location = [lon, lat];
        return this;
    }

    public setEndLocationIndex(value: number): this {
        this.raw.end_location_index = value;
        return this;
    }

    public setPickupCapacity(value: number): this {
        this.raw.pickup_capacity = value;
        return this;
    }

    public setDeliveryCapacity(value: number): this {
        this.raw.delivery_capacity = value;
        return this;
    }

    public addCapability(value: string): this {
        this.raw.capabilities.push(value);
        return this;
    }

    public addTimeWindow(start: number, end: number): this {
        this.raw.time_windows.push([start, end]);
        return this;
    }

    public addBreak(value: Break): this {
        this.raw.breaks.push(value.getRaw());
        return this;
    }

    public setId(value: string): this {
        this.raw.id = value;
        return this;
    }

    public setDescription(value: string): this {
        this.raw.description = value;
        return this;
    }
}
