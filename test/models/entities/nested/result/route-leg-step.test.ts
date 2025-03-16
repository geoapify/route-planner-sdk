import { RouteLegStep, RouteLegStepData } from "../../../../../src";

describe("RouteLegStep", () => {
    let routeLegStep: RouteLegStep;
    let initialData: RouteLegStepData;

    beforeEach(() => {
        initialData = {
            distance: 1000,
            time: 120,
            from_index: 0,
            to_index: 1,
        };

        routeLegStep = new RouteLegStep(initialData);
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new RouteLegStep(undefined as any)).toThrow("RouteLegStepData is undefined");
    });

    test("should return the raw data", () => {
        expect(routeLegStep.getRaw()).toEqual(initialData);
    });

    test("should return distance", () => {
        expect(routeLegStep.getDistance()).toBe(1000);
    });

    test("should return time", () => {
        expect(routeLegStep.getTime()).toBe(120);
    });

    test("should return from index", () => {
        expect(routeLegStep.getFromIndex()).toBe(0);
    });

    test("should return to index", () => {
        expect(routeLegStep.getToIndex()).toBe(1);
    });
});
