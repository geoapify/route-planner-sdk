import { LocationData } from "../../../interfaces";

export class Location {
    private raw: LocationData;

    constructor(raw?: LocationData) {
        if(raw) {
            this.raw = raw;
        } else {
            this.raw = {};
        }
    }

    getRaw(): LocationData {
        return this.raw;
    }

    setRaw(value: LocationData) {
        this.raw = value;
    }
    public setId(id: string): this {
        this.raw.id = id;
        return this;
    }

    public setLocation(lon: number, lat: number): this {
        this.raw.location = [lon, lat];
        return this;
    }
}