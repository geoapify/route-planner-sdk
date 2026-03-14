import {
    AgentData,
    AgentPlan,
    AgentPlanData,
    RouteAction,
    RouteLeg,
    RoutingOptions,
    TimeWindowViolation,
    Waypoint
} from "../../../../../src";
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
                { type: "pickup", start_time: 600, duration: 30, job_id: "J1", shipment_id: "S1", waypoint_index: 0, index: 2 },
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

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should throw an error if no data is provided", () => {
        expect(() => new AgentPlan(undefined as any, agentInputData, routingOptions, callOptions, [])).toThrow("AgentSolutionData is undefined");
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

    test("should return planned shipments and jobs as unique indexes", () => {
        const planData: AgentPlanData = {
            ...initialData,
            actions: [
                { type: "pickup", start_time: 1, duration: 1, shipment_index: 10, shipment_id: "S10", index: 0 },
                { type: "delivery", start_time: 2, duration: 1, shipment_index: 10, shipment_id: "S10", index: 1 },
                { type: "pickup", start_time: 3, duration: 1, shipment_index: 11, shipment_id: "S11", index: 2 },
                { type: "job", start_time: 4, duration: 1, job_index: 21, job_id: "J21", index: 3 },
                { type: "job", start_time: 5, duration: 1, job_index: 21, job_id: "J21", index: 4 },
                { type: "job", start_time: 6, duration: 1, job_index: 22, job_id: "J22", index: 5 }
            ]
        };
        const p = new AgentPlan(planData, agentInputData, routingOptions, callOptions, []);
        expect(p.getPlannedShipments()).toEqual([10, 11]);
        expect(p.getPlannedJobs()).toEqual([21, 22]);
    });

    test("should expose agent input data and violations", () => {
        const violations = [new TimeWindowViolation("tw", 1)];
        const p = new AgentPlan(initialData, agentInputData, routingOptions, callOptions, violations);
        expect(p.getAgentInputData()).toEqual(agentInputData);
        expect(p.getViolations()).toEqual(violations);
    });

    test("should check containsShipment and containsJob by id and index", () => {
        const planData: AgentPlanData = {
            ...initialData,
            actions: [
                { type: "pickup", start_time: 1, duration: 1, shipment_index: 5, shipment_id: "SHIP-5", index: 0 },
                { type: "job", start_time: 1, duration: 1, job_index: 7, job_id: "JOB-7", index: 1 }
            ]
        };
        const p = new AgentPlan(planData, agentInputData, routingOptions, callOptions, []);
        expect(p.containsShipment(5)).toBe(true);
        expect(p.containsShipment("SHIP-5")).toBe(true);
        expect(p.containsShipment(6)).toBe(false);
        expect(p.containsJob(7)).toBe(true);
        expect(p.containsJob("JOB-7")).toBe(true);
        expect(p.containsJob(8)).toBe(false);
    });

    test("should return undefined route when there are no waypoints", async () => {
        const planData: AgentPlanData = { ...initialData, waypoints: [] };
        const p = new AgentPlan(planData, agentInputData, routingOptions, callOptions, []);
        const route = await p.getRoute({ mode: "drive" });
        expect(route).toBeUndefined();
    });

    test("should return fallback feature when routing response has no feature", async () => {
        const fetchSpy = jest.spyOn(global, "fetch" as any).mockResolvedValue({
            json: async () => ({})
        } as any);

        const route = await agentPlan.getRoute({
            mode: "drive",
            type: "balanced",
            units: "metric",
            lang: "en",
            avoid: [{ type: "tolls", values: [] }],
            details: ["route_details"],
            traffic: "free_flow",
            max_speed: 80
        });

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const url = String(fetchSpy.mock.calls[0][0]);
        expect(url).toContain("/v1/routing?waypoints=lonlat:");
        expect(url).toContain("&mode=drive");
        expect(url).toContain("&type=balanced");
        expect(url).toContain("&units=metric");
        expect(url).toContain("&lang=en");
        expect(url).toContain("&avoid=tolls");
        expect(url).toContain("&details=route_details");
        expect(url).toContain("&traffic=free_flow");
        expect(url).toContain("&max_speed=80");

        expect(route.type).toBe("Feature");
        expect(route.geometry.type).toBe("LineString");
        expect(route.properties.agent_index).toBe(1);
        expect(route.properties.agent_id).toBe("A1");
    });

    test("should enrich returned feature with agent fields", async () => {
        jest.spyOn(global, "fetch" as any).mockResolvedValue({
            json: async () => ({
                features: [
                    {
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: [] },
                        properties: { units: "metric" }
                    }
                ]
            })
        } as any);

        const route = await agentPlan.getRoute({ mode: "drive" });
        expect(route.properties.units).toBe("metric");
        expect(route.properties.agent_index).toBe(1);
        expect(route.properties.agent_id).toBe("A1");
    });
});
