import { BaseSerializable } from "./base-serializable";
import { RouteCoordinates } from "./route-coordinates";

export class RouteAvoid extends BaseSerializable {
    public type?: string;
    public values: RouteCoordinates[] = [];

    public setType(type: string): this {
        this.type = type;
        return this;
    }

    public addValue(lon: number, lat: number): this {
        this.values.push(new RouteCoordinates().setLat(lat).setLon(lon));
        return this;
    }
}