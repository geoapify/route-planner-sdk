import { BaseSerializable } from "./base-serializable";

export class RouteAvoid extends BaseSerializable {
    // TODO: need to test
    public type?: string;
    public values: [number, number][] = [];

    public setType(type: string): this {
        this.type = type;
        return this;
    }

    public addValue(lon: number, lat: number): this {
        this.values.push([lon, lat]);
        return this;
    }
}