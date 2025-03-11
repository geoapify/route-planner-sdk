import { BaseSerializable } from "./base-serializable";

export class RouteCoordinates extends BaseSerializable {
    public lon?: number;
    public lat?: number;

    public setLat(lat: number): this {
        this.lat = lat;
        return this;
    }

    public setLon(lon: number): this {
        this.lon = lon;
        return this;
    }
}