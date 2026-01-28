import {AgentPlan, AgentPlanData, RouteAction, RouteLeg, Waypoint, AgentData, RoutingOptions} from "../../../../../src";
import {RoutePlannerCallOptions} from "../../../../../src/models/interfaces/route-planner-call-options";

describe("AgentPlan", () => {
    let agentPlan: AgentPlan;
    let initialData: AgentPlanData;
    let agentInputData: AgentData;
    let routingOptions: RoutingOptions;
    let callOptions: RoutePlannerCallOptions;

    beforeEach(() => {
        initialData = {
            agentIndex: 1,
            agentId: "A1",
            time: 1000,
            start_time: 500,
            end_time: 2000,
            distance: 15000,
            mode: "drive",
            legs: [
                { time: 300, distance: 5000, steps: [], from_waypoint_index: 0, to_waypoint_index: 1 },
            ],
            actions: [
                { type: "pickup", start_time: 600, duration: 30, job_id: "J1", shipment_id: "S1", waypoint_index: 0 },
            ],
            waypoints: [
                { original_location: [40.712776, -74.005974], location: [34.052235, -118.243683], start_time: 500, duration: 30, actions: [] },
            ],
        };

        agentInputData = {
            start_location: [40.712776, -74.005974],
            time_windows: [],
            capabilities: [],
            breaks: []
        };

        routingOptions = {
            mode: 'drive'
        };

        callOptions = {
            apiKey: 'test-key',
            baseUrl: 'https://api.geoapify.com'
        };

        agentPlan = new AgentPlan(initialData, agentInputData, routingOptions, callOptions, []);
    });

    test("should return the raw data", () => {
        expect(agentPlan.getRaw()).toEqual(initialData);
    });

    test("should return agent index", () => {
        expect(agentPlan.getAgentIndex()).toBe(1);
    });

    test("should return agent ID", () => {
        expect(agentPlan.getAgentId()).toBe("A1");
    });

    test("should return agent time", () => {
        expect(agentPlan.getTime()).toBe(1000);
    });

    test("should return agent start time", () => {
        expect(agentPlan.getStartTime()).toBe(500);
    });

    test("should return agent end time", () => {
        expect(agentPlan.getEndTime()).toBe(2000);
    });

    test("should return agent distance", () => {
        expect(agentPlan.getDistance()).toBe(15000);
    });

    test("should return agent mode", () => {
        expect(agentPlan.getMode()).toBe("drive");
    });

    test("should return an array of RouteLeg instances", () => {
        const legs = agentPlan.getLegs();
        expect(legs.length).toBe(1);
        expect(legs[0]).toBeInstanceOf(RouteLeg);
    });

    test("should return an array of RouteAction instances", () => {
        const actions = agentPlan.getActions();
        expect(actions.length).toBe(1);
        expect(actions[0]).toBeInstanceOf(RouteAction);
    });

    test("should return an array of Waypoint instances", () => {
        const waypoints = agentPlan.getWaypoints();
        expect(waypoints.length).toBe(1);
        expect(waypoints[0]).toBeInstanceOf(Waypoint);
    });
});