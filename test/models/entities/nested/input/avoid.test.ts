import { Avoid, AvoidData, AvoidType } from "../../../../../src";

describe("Avoid", () => {
    let avoid: Avoid;
    let initialData: AvoidData;

    beforeEach(() => {
        initialData = {
            type: "toll_roads" as AvoidType,
            values: [
                { lat: 40.712776, lon: -74.005974 },
            ],
        };

        avoid = new Avoid(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultAvoid = new Avoid();
        expect(defaultAvoid.getRaw()).toEqual({
            values: [],
        });
    });

    test("should return the raw data", () => {
        expect(avoid.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: AvoidData = {
            type: "highways" as AvoidType,
            values: [{ lat: 34.052235, lon: -118.243683 }],
        };
        avoid.setRaw(newData);
        expect(avoid.getRaw()).toEqual(newData);
    });

    test("should set avoid type", () => {
        avoid.setType("ferries" as AvoidType);
        expect(avoid.getRaw().type).toBe("ferries");
    });

    test("should add coordinates", () => {
        avoid.addValue(10.0, 20.0);
        expect(avoid.getRaw().values).toContainEqual({ lat: 20.0, lon: 10.0 });
    });
});
