export interface ShipmentDurationOption {
    probability: number;
    value: {
        pickupDuration: number;
        deliveryDuration: number;
    }
}
