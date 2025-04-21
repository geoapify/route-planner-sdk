import { RoutePlannerOptions } from "../../../src/models/interfaces/route-planner-options";
import { AgentSolution, RouteAction, RouteActionInfo, RouteLeg, RoutePlannerResultData, Waypoint } from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import TEST_API_KEY from "../../../env-variables";
import { generateRawResponse } from "../../utils.helper";

describe("RoutePlannerResult", () => {
    let options: RoutePlannerOptions;
    let rawData: RoutePlannerResultData;
    let routePlannerResult: RoutePlannerResult;

    beforeEach(() => {
        options = {
            apiKey: "API_KEY",
            baseUrl: "BASE_URL",
            httpOptions: {
                header1: {
                    key: "header1Key",
                },
            },
        };

        rawData = {
            agents: [
                {
                    agentIndex: 1,
                    agentId: "A1",
                    time: 1000,
                    start_time: 500,
                    end_time: 2000,
                    distance: 15000,
                    mode: "drive",
                    legs: [
                        {
                            time: 300,
                            distance: 5000,
                            steps: [],
                            from_waypoint_index: 0,
                            to_waypoint_index: 1,
                        },
                    ],
                    actions: [
                        {
                            type: "pickup",
                            start_time: 600,
                            duration: 30,
                            shipment_index: 1,
                            shipment_id: "S1",
                            location_index: 0,
                            location_id: "1",
                            job_index: 0,
                            job_id: "J1",
                            index: 0,
                            waypoint_index: 0,
                        },
                    ],
                    waypoints: [
                        {
                            original_location: [-74.005974, 40.712776],
                            original_location_index: 0,
                            original_location_id: 1,
                            location: [-118.243683, 34.052235],
                            start_time: 500,
                            duration: 30,
                            actions: [],
                            prev_leg_index: undefined,
                            next_leg_index: 0,
                        }
                    ],
                },
            ],
            unassignedAgents: [2],
            unassignedJobs: [3],
            unassignedShipments: [4, 5],
            inputData: {} as any
        };

        routePlannerResult = new RoutePlannerResult(options, rawData, generateRawResponse());
    });

    test("should return raw data", () => {
        expect(routePlannerResult.getData()).toEqual(rawData);
    });

    test("should return options", () => {
        expect(routePlannerResult.getOptions()).toEqual(options);
    });

    test("should return all agent solutions", () => {
        expect(routePlannerResult.getAgentSolutions()).toEqual(rawData.agents.map(agent => new AgentSolution(agent)));
    });

    test("should return a specific agent solution", () => {
        expect(routePlannerResult.getAgentSolution("A1")).toEqual(new AgentSolution(rawData.agents[0]));
    });

    test("should return undefined for a non-existent agent solution", () => {
        expect(routePlannerResult.getAgentSolution("A2")).toBeUndefined();
    });

    test("should return waypoints for a specific agent", () => {
        expect(routePlannerResult.getAgentWaypoints("A1")).toEqual(rawData.agents[0].waypoints.map(waypoint => new Waypoint(waypoint)));
    });

    test("should return an empty array for waypoints of a non-existent agent", () => {
        expect(routePlannerResult.getAgentWaypoints("A2")).toEqual([]);
    });

    test("should return route actions for a specific agent", () => {
        expect(routePlannerResult.getAgentRouteActions("A1")).toEqual(rawData.agents[0].actions.map(action => new RouteAction(action)));
    });

    test("should return an empty array for route actions of a non-existent agent", () => {
        expect(routePlannerResult.getAgentRouteActions("A2")).toEqual([]);
    });

    test("should return route legs for a specific agent", () => {
        expect(routePlannerResult.getAgentRouteLegs("A1")).toEqual(rawData.agents[0].legs.map(leg => new RouteLeg(leg)));
    });

    test("should return an empty array for route legs of a non-existent agent", () => {
        expect(routePlannerResult.getAgentRouteLegs("A2")).toEqual([]);
    });

    test("should return assigned jobs for a specific agent", () => {
        expect(routePlannerResult.getAgentJobs("A1")).toEqual(["J1"]);
    });

    test("should return an empty array for assigned jobs of a non-existent agent", () => {
        expect(routePlannerResult.getAgentJobs("A2")).toEqual([]);
    });

    test("should return assigned shipments for a specific agent", () => {
        expect(routePlannerResult.getAgentShipments("A1")).toEqual(["S1"]);
    });

    test("should return an empty array for assigned shipments of a non-existent agent", () => {
        expect(routePlannerResult.getAgentShipments("A2")).toEqual([]);
    });

    test("should return unassigned agents", () => {
        expect(routePlannerResult.getUnassignedAgents()).toEqual([2]);
    });

    test("should return unassigned jobs", () => {
        expect(routePlannerResult.getUnassignedJobs()).toEqual([3]);
    });

    test("should return unassigned shipments", () => {
        expect(routePlannerResult.getUnassignedShipments()).toEqual([4, 5]);
    });

    test("should return job info when job exists", () => {
        expect(routePlannerResult.getJobInfo("J1")).toEqual(new RouteActionInfo({
            agentId: "A1",
            action: new RouteAction(rawData.agents[0].actions[0]),
            agent: new AgentSolution(rawData.agents[0]),
        }));
    });

    test("should return null for a non-existent job", () => {
        expect(routePlannerResult.getJobInfo("J2")).toBeUndefined();
    });

    test("should return shipment info when shipment exists", () => {
        expect(routePlannerResult.getShipmentInfo("S1")).toEqual(new RouteActionInfo({
            agentId: "A1",
            action: new RouteAction(rawData.agents[0].actions[0]),
            agent: new AgentSolution(rawData.agents[0]),
        }));
    });

    test("should return null for a non-existent shipment", () => {
        expect(routePlannerResult.getShipmentInfo("S2")).toBeUndefined();
    });

    test("should getAgentRoute() call routing API agent not found", async () => {
        routePlannerResult.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult.getAgentRoute("TESTING1", 'drive');
        expect(result).toBeUndefined();
    });

    test("should getAgentRoute() call routing API success without waypoint", async () => {
        let rawData1 = JSON.parse(JSON.stringify(rawData));
        rawData1.agents[0].waypoints = [];
        let routePlannerResult1 = new RoutePlannerResult(options, rawData1, generateRawResponse());
        routePlannerResult1.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult1.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult1.getAgentRoute("A1", 'drive');
        expect(result).toBeUndefined();
    });

    test("should getAgentRoute() call routing API success with 1 waypoint", async () => {
        routePlannerResult.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult.getAgentRoute("A1", 'drive');
        expect(result.statusCode).toBe(400);
        expect(result.error).toBe("Bad Request")
        expect(result.message).toBe("Insufficient number of locations provided")
    });

    test("should getAgentRoute() call routing API success with 2 waypoints", async () => {
        let rawData1 = JSON.parse(JSON.stringify(rawData));
        rawData1.agents[0].waypoints.push(
            {
                original_location: [-74.005974, 40.712776],
                original_location_index: 0,
                original_location_id: 1,
                location: [-118.243683, 34.052235],
                start_time: 500,
                duration: 30,
                actions: [],
                prev_leg_index: undefined,
                next_leg_index: 0,
            }
        );
        let routePlannerResult1 = new RoutePlannerResult(options, rawData1, generateRawResponse());
        routePlannerResult1.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult1.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult1.getAgentRoute("A1", 'drive');
        expect(result.features.length).toBe(1);
    });
});
