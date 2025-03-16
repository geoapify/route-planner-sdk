import { RouteAction, Waypoint, WaypointData } from "../../../../../src";

describe("Waypoint", () => {
    let waypoint: Waypoint;
    let initialData: WaypointData;

    beforeEach(() => {
        initialData = {
            original_location: [40.712776, -74.005974],
            original_location_index: 0,
            original_location_id: 100,
            location: [34.052235, -118.243683],
            start_time: 500,
            duration: 100,
            actions: [
                { type: "pickup", start_time: 600, duration: 30, job_id: "J1", shipment_id: "S1", waypoint_index: 1 },
            ],
            prev_leg_index: 1,
            next_leg_index: 2,
        };

        waypoint = new Waypoint(initialData);
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new Waypoint(undefined as any)).toThrow("WaypointData is undefined");
    });

    test("should return the raw data", () => {
        expect(waypoint.getRaw()).toEqual(initialData);
    });

    test("should return original location", () => {
        expect(waypoint.getOriginalLocation()).toEqual([40.712776, -74.005974]);
    });

    test("should return original location index", () => {
        expect(waypoint.getOriginalLocationIndex()).toBe(0);
    });

    test("should return original location ID", () => {
        expect(waypoint.getOriginalLocationId()).toBe(100);
    });

    test("should return location", () => {
        expect(waypoint.getLocation()).toEqual([34.052235, -118.243683]);
    });

    test("should return start time", () => {
        expect(waypoint.getStartTime()).toBe(500);
    });

    test("should return duration", () => {
        expect(waypoint.getDuration()).toBe(100);
    });

    test("should return an array of RouteAction instances", () => {
        const actions = waypoint.getActions();
        expect(actions.length).toBe(1);
        expect(actions[0]).toBeInstanceOf(RouteAction);
    });

    test("should return previous leg index", () => {
        expect(waypoint.getPrevLegIndex()).toBe(1);
    });

    test("should return next leg index", () => {
        expect(waypoint.getNextLegIndex()).toBe(2);
    });

    test("should return an empty array if no actions are provided", () => {
        const emptyActionsData: WaypointData = {
            ...initialData,
            actions: [],
        };
        const emptyActionsWaypoint = new Waypoint(emptyActionsData);
        expect(emptyActionsWaypoint.getActions()).toEqual([]);
    });
});
