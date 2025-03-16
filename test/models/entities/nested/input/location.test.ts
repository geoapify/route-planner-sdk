import { LocationData, Location } from "../../../../../src";

describe("Location", () => {
    let location: Location;
    let initialData: LocationData;

    beforeEach(() => {
        initialData = {
            id: "L1",
            location: [40.712776, -74.005974],
        };

        location = new Location(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultLocation = new Location();
        expect(defaultLocation.getRaw()).toEqual({});
    });

    test("should return the raw data", () => {
        expect(location.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: LocationData = { id: "L2", location: [34.052235, -118.243683] };
        location.setRaw(newData);
        expect(location.getRaw()).toEqual(newData);
    });

    test("should set ID", () => {
        location.setId("L2");
        expect(location.getRaw().id).toBe("L2");
    });

    test("should set location", () => {
        location.setLocation(10.0, 20.0);
        expect(location.getRaw().location).toEqual([10.0, 20.0]);
    });
});
