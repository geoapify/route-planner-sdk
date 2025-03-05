import { BaseSerializable } from "./base-serializable";

export class RouteJob extends BaseSerializable{
    public id?: string;
    public location?: [number, number];

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setLocation(lon: number, lat: number): this {
        this.location = [lon, lat];
        return this;
    }
}