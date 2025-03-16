import { Break, BreakData } from "../../../../../src";

describe("Break", () => {
    let breakInstance: Break;
    let initialData: BreakData;

    beforeEach(() => {
        initialData = {
            time_windows: [
                [1609459200, 1609462800],
            ],
            duration: 600,
        };

        breakInstance = new Break(initialData);
    });

    test("should initialize with default values when no input is provided", () => {
        const defaultBreak = new Break();
        expect(defaultBreak.getRaw()).toEqual({
            time_windows: [],
        });
    });

    test("should return the raw data", () => {
        expect(breakInstance.getRaw()).toEqual(initialData);
    });

    test("should update raw data with setRaw()", () => {
        const newData: BreakData = {
            time_windows: [[1609462800, 1609466400]],
            duration: 1200
        };
        breakInstance.setRaw(newData);
        expect(breakInstance.getRaw()).toEqual(newData);
    });

    test("should add a time window", () => {
        breakInstance.addTimeWindow(1609466400, 1609470000);
        expect(breakInstance.getRaw().time_windows).toContainEqual([1609466400, 1609470000]);
    });

    test("should set duration", () => {
        breakInstance.setDuration(1800);
        expect(breakInstance.getRaw().duration).toBe(1800);
    });
});
