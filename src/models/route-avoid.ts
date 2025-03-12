import { BaseSerializable } from "./base-serializable";
import { RouteCoordinates } from "./route-coordinates";
import { AvoidType } from "./types";

export class RouteAvoid extends BaseSerializable {
    public type?: AvoidType;
    public values: RouteCoordinates[] = [];

    public setType(type: AvoidType): this {
        this.type = type;
        return this;
    }

    public addValue(lon: number, lat: number): this {
        this.values.push(new RouteCoordinates().setLat(lat).setLon(lon));
        return this;
    }
}