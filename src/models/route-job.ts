import { BaseSerializable } from "./base-serializable";

export class RouteJob extends BaseSerializable{
    public location?: [number, number];
    public location_index?: number;
    public priority?: number;
    public duration?: number;
    public pickup_amount?: number;
    public delivery_amount?: number;
    public requirements: string[] = [];
    public time_windows: [number, number][] = [];
    public id?: string;
    public description?: string;

    public setLocation(lon: number, lat: number): this {
        this.location = [lon, lat];
        return this;
    }

    public setLocationIndex(value: number): this {
        this.location_index = value;
        return this;
    }

    public setPriority(value: number): this {
        this.priority = value;
        return this;
    }

    public setDuration(value: number): this {
        this.duration = value;
        return this;
    }

    public setPickupAmount(value: number): this {
        this.pickup_amount = value;
        return this;
    }

    public setDeliveryAmount(value: number): this {
        this.delivery_amount = value;
        return this;
    }

    public addRequirement(value: string): this {
        this.requirements.push(value);
        return this;
    }

    public addTimeWindow(start: number, end: number): this {
        this.time_windows.push([start, end]);
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