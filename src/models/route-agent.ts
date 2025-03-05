import { RouteBreak } from "./route-break";
import { BaseSerializable } from "./base-serializable";

export class RouteAgent extends BaseSerializable {
    public start_location?: [number, number];
    public start_location_index?: number;
    public end_location?: [number, number];
    public end_location_index?: number;
    public pickup_capacity?: number;
    public delivery_capacity?: number;
    public capabilities: string[] = [];
    public time_windows: [number, number][] = [];
    public breaks: RouteBreak[] = [];
    public id?: string;
    public description?: string;

    public setStartLocation(lon: number, lat: number): this {
        this.start_location = [lon, lat];
        return this;
    }

    public setStartLocationIndex(value: number): this {
        this.start_location_index = value;
        return this;
    }

    public setEndLocation(lon: number, lat: number): this {
        this.end_location = [lon, lat];
        return this;
    }

    public setEndLocationIndex(value: number): this {
        this.end_location_index = value;
        return this;
    }

    public setPickupCapacity(value: number): this {
        this.pickup_capacity = value;
        return this;
    }

    public setDeliveryCapacity(value: number): this {
        this.delivery_capacity = value;
        return this;
    }

    public addCapability(value: string): this {
        this.capabilities.push(value);
        return this;
    }

    public addTimeWindow(start: number, end: number): this {
        this.time_windows.push([start, end]);
        return this;
    }

    public addBreak(value: RouteBreak): this {
        this.breaks.push(value);
        return this;
    }

    public setId(value: string): this {
        this.id = value;
        return this;
    }

    public setDescription(value: string): this {
        this.description = value;
        return this;
    }
}
