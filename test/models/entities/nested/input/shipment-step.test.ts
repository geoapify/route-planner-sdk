import { ShipmentStep, ShipmentStepData } from "../../../../../src";

describe("ShipmentStep", () => {
    let shipmentStep: ShipmentStep;
    let initialData: ShipmentStepData;

    beforeEach(() => {
        initialData = {
            location: [40.712776, -74.005974],
            location_index: 1,
            duration: 300,
            time_windows: [[1609459200, 1609462800]]
        };

        shipmentStep = new ShipmentStep(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultShipmentStep = new ShipmentStep();
        expect(defaultShipmentStep.getRaw()).toEqual({
            time_windows: [],
        });
    });

    test("should return the raw data", () => {
        expect(shipmentStep.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: ShipmentStepData = {
            location: [34.052235, -118.243683],
            location_index: 2,
            duration: 600,
            time_windows: [[1609462800, 1609470000]],
        };
        shipmentStep.setRaw(newData);
        expect(shipmentStep.getRaw()).toEqual(newData);
    });

    test("should set location", () => {
        shipmentStep.setLocation(10.0, 20.0);
        expect(shipmentStep.getRaw().location).toEqual([10.0, 20.0]);
    });

    test("should set location index", () => {
        shipmentStep.setLocationIndex(5);
        expect(shipmentStep.getRaw().location_index).toBe(5);
    });

    test("should set duration", () => {
        shipmentStep.setDuration(600);
        expect(shipmentStep.getRaw().duration).toBe(600);
    });

    test("should add a time window", () => {
        shipmentStep.addTimeWindow(1609466400, 1609470000);
        expect(shipmentStep.getRaw().time_windows).toContainEqual([1609466400, 1609470000]);
    });
});
