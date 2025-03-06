import { BaseSerializable } from "./base-serializable";

export class RouteShipmentLocation extends BaseSerializable {
    public location?: [number, number];
    public location_index?: number;
    public duration?: number;
    public time_windows: [number, number][] = [];

    public setLocation(lon: number, lat: number): this {
        this.location = [lon, lat];
        return this;
    }

    public setLocationIndex(value: number): this {
        this.location_index = value;
        return this;
    }

    public setDuration(value: number): this {
        this.duration = value;
        return this;
    }

    public addTimeWindow(start: number, end: number): this {
        this.time_windows.push([start, end]);
        return this;
    }
}