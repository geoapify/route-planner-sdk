import { BaseSerializable } from "../../base-serializable";
import { CoordinatesData } from "../../interfaces";

export class Coordinates extends BaseSerializable {
    private raw: CoordinatesData;

    constructor(raw?: CoordinatesData) {
        super();
        if(raw) {
            this.raw = raw;
        } else {
            this.raw = {};
        }
    }

    getRaw(): CoordinatesData {
        return this.raw;
    }

    setRaw(value: CoordinatesData) {
        this.raw = value;
    }

    public setLat(lat: number): this {
        this.raw.lat = lat;
        return this;
    }

    public setLon(lon: number): this {
        this.raw.lon = lon;
        return this;
    }
}