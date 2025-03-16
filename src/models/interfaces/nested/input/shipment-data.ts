import { ShipmentStepData } from "./shipment-step-data";

export interface ShipmentData {
    id?: string;
    pickup?: ShipmentStepData;
    delivery?: ShipmentStepData;
    requirements: string[];
    priority?: number;
    description?: string;
    amount?: number;
}