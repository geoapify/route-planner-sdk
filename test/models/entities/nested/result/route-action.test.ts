import { RouteAction, RouteActionData } from "../../../../../src";

describe("RouteAction", () => {
    let routeAction: RouteAction;
    let initialData: RouteActionData;

    beforeEach(() => {
        initialData = {
            type: "pickup",
            start_time: 600,
            duration: 30,
            shipment_index: 1,
            shipment_id: "S1",
            location_index: 2,
            location_id: 10,
            job_index: 3,
            job_id: "J1",
            index: 5,
            waypoint_index: 0,
        };

        routeAction = new RouteAction(initialData);
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new RouteAction(undefined as any)).toThrow("RouteActionData is undefined");
    });

    test("should return the raw data", () => {
        expect(routeAction.getRaw()).toEqual(initialData);
    });

    test("should return type", () => {
        expect(routeAction.getType()).toBe("pickup");
    });

    test("should return start time", () => {
        expect(routeAction.getStartTime()).toBe(600);
    });

    test("should return duration", () => {
        expect(routeAction.getDuration()).toBe(30);
    });

    test("should return shipment index", () => {
        expect(routeAction.getShipmentIndex()).toBe(1);
    });

    test("should return shipment ID", () => {
        expect(routeAction.getShipmentId()).toBe("S1");
    });

    test("should return location index", () => {
        expect(routeAction.getLocationIndex()).toBe(2);
    });

    test("should return location ID", () => {
        expect(routeAction.getLocationId()).toBe(10);
    });

    test("should return job index", () => {
        expect(routeAction.getJobIndex()).toBe(3);
    });

    test("should return job ID", () => {
        expect(routeAction.getJobId()).toBe("J1");
    });

    test("should return index", () => {
        expect(routeAction.getIndex()).toBe(5);
    });

    test("should return waypoint index", () => {
        expect(routeAction.getWaypointIndex()).toBe(0);
    });

    test("should return undefined for optional fields if not provided", () => {
        const partialData: RouteActionData = {
            type: "dropoff",
            start_time: 700,
            duration: 40,
            waypoint_index: 1
        };
        const partialRouteAction = new RouteAction(partialData);

        expect(partialRouteAction.getShipmentIndex()).toBeUndefined();
        expect(partialRouteAction.getShipmentId()).toBeUndefined();
        expect(partialRouteAction.getLocationIndex()).toBeUndefined();
        expect(partialRouteAction.getLocationId()).toBeUndefined();
        expect(partialRouteAction.getJobIndex()).toBeUndefined();
        expect(partialRouteAction.getJobId()).toBeUndefined();
        expect(partialRouteAction.getIndex()).toBeUndefined();
    });
});
