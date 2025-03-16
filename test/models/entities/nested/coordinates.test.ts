import { Coordinates, CoordinatesData } from "../../../../src";

describe("Coordinates", () => {
    let coordinates: Coordinates;
    let initialData: CoordinatesData;

    beforeEach(() => {
        initialData = {
            lat: 40.712776,
            lon: -74.005974,
        };

        coordinates = new Coordinates(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultCoordinates = new Coordinates();
        expect(defaultCoordinates.getRaw()).toEqual({});
    });

    test("should return the raw data", () => {
        expect(coordinates.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: CoordinatesData = { lat: 34.052235, lon: -118.243683 };
        coordinates.setRaw(newData);
        expect(coordinates.getRaw()).toEqual(newData);
    });

    test("should set latitude", () => {
        coordinates.setLat(50.0);
        expect(coordinates.getRaw().lat).toBe(50.0);
    });

    test("should set longitude", () => {
        coordinates.setLon(20.0);
        expect(coordinates.getRaw().lon).toBe(20.0);
    });
});
