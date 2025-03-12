import { BaseSerializable } from "../../base-serializable";
import { JobData } from "../../interfaces";

export class Job extends BaseSerializable{
    private raw: JobData;

    constructor(raw?: JobData) {
        super();
        if (raw) {
            this.raw = raw;
        } else {
            this.raw = {
                requirements: [],
                time_windows: []
            };
        }
    }

    getRaw(): JobData {
        return this.raw;
    }

    setRaw(value: JobData) {
        this.raw = value;
    }

    public setLocation(lon: number, lat: number): this {
        this.raw.location = [lon, lat];
        return this;
    }

    public setLocationIndex(value: number): this {
        this.raw.location_index = value;
        return this;
    }

    public setPriority(value: number): this {
        this.raw.priority = value;
        return this;
    }

    public setDuration(value: number): this {
        this.raw.duration = value;
        return this;
    }

    public setPickupAmount(value: number): this {
        this.raw.pickup_amount = value;
        return this;
    }

    public setDeliveryAmount(value: number): this {
        this.raw.delivery_amount = value;
        return this;
    }

    public addRequirement(value: string): this {
        this.raw.requirements.push(value);
        return this;
    }

    public addTimeWindow(start: number, end: number): this {
        this.raw.time_windows.push([start, end]);
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