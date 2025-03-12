import { BaseSerializable } from "../../base-serializable";
import { Coordinates } from "./coordinates";
import { AvoidType } from "../../types";
import { AvoidData } from "../../interfaces";

export class Avoid extends BaseSerializable {
    private raw: AvoidData;

    constructor(raw?: AvoidData) {
        super();
        if(raw) {
            this.raw = raw;
        } else {
            this.raw = {
                values: []
            };
        }
    }

    getRaw(): AvoidData {
        return this.raw;
    }

    setRaw(value: AvoidData) {
        this.raw = value;
    }

    public setType(type: AvoidType): this {
        this.raw.type = type;
        return this;
    }

    public addValue(lon: number, lat: number): this {
        let newCoordinates = new Coordinates().setLat(lat).setLon(lon)
        this.raw.values.push(newCoordinates.getRaw());
        return this;
    }
}