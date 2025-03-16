import { RouteLeg, RouteLegData, RouteLegStep } from "../../../../../src";

describe("RouteLeg", () => {
    let routeLeg: RouteLeg;
    let initialData: RouteLegData;

    beforeEach(() => {
        initialData = {
            time: 300,
            distance: 5000,
            steps: [
                { distance: 1000, time: 120, from_index: 0, to_index: 1 },
            ],
            from_waypoint_index: 0,
            to_waypoint_index: 1,
        };

        routeLeg = new RouteLeg(initialData);
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new RouteLeg(undefined as any)).toThrow("RouteLegData is undefined");
    });

    test("should return the raw data", () => {
        expect(routeLeg.getRaw()).toEqual(initialData);
    });

    test("should return time", () => {
        expect(routeLeg.getTime()).toBe(300);
    });

    test("should return distance", () => {
        expect(routeLeg.getDistance()).toBe(5000);
    });

    test("should return an array of RouteLegStep instances", () => {
        const steps = routeLeg.getSteps();
        expect(steps.length).toBe(1);
        expect(steps[0]).toBeInstanceOf(RouteLegStep);
    });

    test("should return from waypoint index", () => {
        expect(routeLeg.getFromWaypointIndex()).toBe(0);
    });

    test("should return to waypoint index", () => {
        expect(routeLeg.getToWaypointIndex()).toBe(1);
    });

    test("should return an empty array if no steps are provided", () => {
        const emptyLegData: RouteLegData = {
            time: 400,
            distance: 6000,
            steps: [],
            from_waypoint_index: 2,
            to_waypoint_index: 3,
        };
        const emptyLeg = new RouteLeg(emptyLegData);
        expect(emptyLeg.getSteps()).toEqual([]);
    });
});
