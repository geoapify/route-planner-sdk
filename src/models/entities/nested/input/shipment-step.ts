import { ShipmentStepData } from "../../../interfaces";

export class ShipmentStep {
    private raw: ShipmentStepData;

    constructor(raw?: ShipmentStepData) {
        if(raw) {
            this.raw = raw;
        } else {
            this.raw = {
                time_windows: []
            };
        }
    }

    getRaw(): ShipmentStepData {
        return this.raw;
    }

    setRaw(value: ShipmentStepData): this {
        this.raw = value;
        return this;
    }

    public setLocation(lon: number, lat: number): this {
        this.raw.location = [lon, lat];
        return this;
    }

    public setLocationIndex(value: number): this {
        this.raw.location_index = value;
        return this;
    }

    public setDuration(value: number): this {
        this.raw.duration = value;
        return this;
    }

    public addTimeWindow(start: number, end: number): this {
        this.raw.time_windows.push([start, end]);
        return this;
    }
}