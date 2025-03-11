import { BaseSerializable } from "./base-serializable";
import { RouteShipmentLocation } from "./route-shipment-location";

export class RouteShipment extends BaseSerializable {
    public id?: string;
    public pickup?: RouteShipmentLocation;
    public delivery?: RouteShipmentLocation;
    public requirements: string[] = [];
    public priority?: number;
    public description?: string;
    public amount?: number;

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setPickup(value: RouteShipmentLocation): this {
        this.pickup = value;
        return this;
    }

    public setDelivery(value: RouteShipmentLocation): this {
        this.delivery = value;
        return this;
    }

    public addRequirement(value: string): this {
        this.requirements.push(value);
        return this;
    }

    public setPriority(value: number): this {
        this.priority = value;
        return this;
    }

    public setDescription(value: string): this {
        this.description = value;
        return this;
    }

    public setAmount(value: number): this {
        this.amount = value;
        return this;
    }
}