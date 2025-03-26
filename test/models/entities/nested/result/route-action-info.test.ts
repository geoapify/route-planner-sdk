import {
    AgentSolution,
    AgentSolutionData,
    RouteAction,
    RouteActionData,
    RouteActionInfo,
    RouteActionInfoData
} from "../../../../../src";

describe("RouteActionInfo", () => {
    let routeActionInfo: RouteActionInfo;
    let initialData: RouteActionInfoData;

    const routeAction: RouteActionData = {
        type: "pickup",
        start_time: 600,
        duration: 30,
        shipment_index: 1,
        shipment_id: "S1",
        location_index: 2,
        location_id: "10",
        job_index: 3,
        job_id: "J1",
        index: 5,
        waypoint_index: 0,
    }

    const agentSolution: AgentSolutionData = {
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
    }

    beforeEach(() => {
        initialData = {
            agentId: "agent-A",
            action: new RouteAction(routeAction),
            agent: new AgentSolution(agentSolution)

        };

        routeActionInfo = new RouteActionInfo(initialData);
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new RouteActionInfo(undefined as any)).toThrow("RouteActionInfo is undefined");
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new RouteAction(undefined as any)).toThrow("RouteActionData is undefined");
    });

    test("should return the raw data", () => {
        expect(routeActionInfo.getRaw()).toEqual(initialData);
    });

    test("should return agent id", () => {
        expect(routeActionInfo.getAgentId()).toBe("agent-A");
    });

    test("should return true if action is defined correctly", () => {
        expect(routeActionInfo.getAction()).toBeDefined();
    });

    test("should return true if agent is defined correctly", () => {
        expect(routeActionInfo.getAgent()).toBeDefined();
    });
});
