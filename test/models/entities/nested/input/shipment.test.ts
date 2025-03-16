import { Shipment, ShipmentData, ShipmentStep } from "../../../../../src";

describe("Shipment", () => {
    let shipment: Shipment;
    let initialData: ShipmentData;
    let pickupStep: ShipmentStep;
    let deliveryStep: ShipmentStep;

    beforeEach(() => {
        pickupStep = new ShipmentStep();
        pickupStep.setLocation(10.0, 20.0);
        deliveryStep = new ShipmentStep();
        deliveryStep.setLocation(30.0, 40.0);

        initialData = {
            id: "S1",
            pickup: pickupStep.getRaw(),
            delivery: deliveryStep.getRaw(),
            requirements: ["hazmat"],
            priority: 2,
            description: "Test Shipment",
            amount: 50,
        };

        shipment = new Shipment(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultShipment = new Shipment();
        expect(defaultShipment.getRaw()).toEqual({
            requirements: [],
        });
    });

    test("should return the raw data", () => {
        expect(shipment.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: ShipmentData = {
            id: "S2",
            pickup: pickupStep.getRaw(),
            delivery: deliveryStep.getRaw(),
            requirements: ["fragile"],
            priority: 3,
            description: "Updated Shipment",
            amount: 100,
        };
        shipment.setRaw(newData);
        expect(shipment.getRaw()).toEqual(newData);
    });

    test("should set ID", () => {
        shipment.setId("S2");
        expect(shipment.getRaw().id).toBe("S2");
    });

    test("should set pickup step", () => {
        const newPickupStep = new ShipmentStep();
        newPickupStep.setLocation(15.0, 25.0);
        shipment.setPickup(newPickupStep);
        expect(shipment.getRaw().pickup).toEqual(newPickupStep.getRaw());
    });

    test("should set delivery step", () => {
        const newDeliveryStep = new ShipmentStep();
        newDeliveryStep.setLocation(35.0, 45.0);
        shipment.setDelivery(newDeliveryStep);
        expect(shipment.getRaw().delivery).toEqual(newDeliveryStep.getRaw());
    });

    test("should add requirement", () => {
        shipment.addRequirement("temperature_control");
        expect(shipment.getRaw().requirements).toContain("temperature_control");
    });

    test("should set priority", () => {
        shipment.setPriority(5);
        expect(shipment.getRaw().priority).toBe(5);
    });

    test("should set description", () => {
        shipment.setDescription("Updated Description");
        expect(shipment.getRaw().description).toBe("Updated Description");
    });

    test("should set amount", () => {
        shipment.setAmount(75);
        expect(shipment.getRaw().amount).toBe(75);
    });
});
