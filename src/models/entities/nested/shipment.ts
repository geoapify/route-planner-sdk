import { ShipmentStep } from "./shipment-step";
import { ShipmentData } from "../../interfaces";

export class Shipment {
    private raw: ShipmentData;

    constructor(raw?: ShipmentData) {
        if(raw) {
            this.raw = raw;
        } else {
            this.raw = {
                requirements: []
            };
        }
    }

    getRaw(): ShipmentData {
        return this.raw;
    }

    setRaw(value: ShipmentData) {
        this.raw = value;
    }

    public setId(id: string): this {
        this.raw.id = id;
        return this;
    }

    public setPickup(value: ShipmentStep): this {
        this.raw.pickup = value.getRaw();
        return this;
    }

    public setDelivery(value: ShipmentStep): this {
        this.raw.delivery = value.getRaw();
        return this;
    }

    public addRequirement(value: string): this {
        this.raw.requirements.push(value);
        return this;
    }

    public setPriority(value: number): this {
        this.raw.priority = value;
        return this;
    }

    public setDescription(value: string): this {
        this.raw.description = value;
        return this;
    }

    public setAmount(value: number): this {
        this.raw.amount = value;
        return this;
    }
}