import { AgentSolution, AgentSolutionData, RouteAction, RouteLeg, Waypoint } from "../../../../../src";

describe("AgentSolution", () => {
    let agentSolution: AgentSolution;
    let initialData: AgentSolutionData;

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

        agentSolution = new AgentSolution(initialData);
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new AgentSolution(undefined as any)).toThrow("AgentSolutionData is undefined");
    });

    test("should return the raw data", () => {
        expect(agentSolution.getRaw()).toEqual(initialData);
    });

    test("should return agent index", () => {
        expect(agentSolution.getAgentIndex()).toBe(1);
    });

    test("should return agent ID", () => {
        expect(agentSolution.getAgentId()).toBe("A1");
    });

    test("should return agent time", () => {
        expect(agentSolution.getTime()).toBe(1000);
    });

    test("should return agent start time", () => {
        expect(agentSolution.getStartTime()).toBe(500);
    });

    test("should return agent end time", () => {
        expect(agentSolution.getEndTime()).toBe(2000);
    });

    test("should return agent distance", () => {
        expect(agentSolution.getDistance()).toBe(15000);
    });

    test("should return agent mode", () => {
        expect(agentSolution.getMode()).toBe("drive");
    });

    test("should return an array of RouteLeg instances", () => {
        const legs = agentSolution.getLegs();
        expect(legs.length).toBe(1);
        expect(legs[0]).toBeInstanceOf(RouteLeg);
    });

    test("should return an array of RouteAction instances", () => {
        const actions = agentSolution.getActions();
        expect(actions.length).toBe(1);
        expect(actions[0]).toBeInstanceOf(RouteAction);
    });

    test("should return an array of Waypoint instances", () => {
        const waypoints = agentSolution.getWaypoints();
        expect(waypoints.length).toBe(1);
        expect(waypoints[0]).toBeInstanceOf(Waypoint);
    });
});
