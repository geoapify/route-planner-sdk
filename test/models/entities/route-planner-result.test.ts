import { RoutePlannerOptions } from "../../../src/models/interfaces/route-planner-options";
import {
    AgentSolution,
    RouteAction,
    RouteActionInfo,
    RouteLeg,
    RoutePlannerResultData,
    Waypoint
} from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import TEST_API_KEY from "../../../env-variables";
import {RoutePlannerResultReverseConverter} from "../../route-planner-result-reverse-converter";
import {RoutingOptions} from "../../../src/models/interfaces/routing-options";

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
                    agentIndex: 0,
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
                            shipment_index: 0,
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
            unassignedAgents: [1],
            unassignedJobs: [],
            unassignedShipments: [4, 5],
            inputData: {
                "agents": [
                    {
                        "capabilities": [
                            "heavy-items",
                            "small-items"
                        ],
                        "time_windows": [],
                        "breaks": [],
                        "start_location": [
                            44.50932929564533,
                            40.18686625
                        ],
                        "id": "A1"
                    },
                    {
                        "capabilities": [
                            "heavy-items",
                            "small-items"
                        ],
                        "time_windows": [],
                        "breaks": [],
                        "start_location": [
                            44.400450399509495,
                            40.153735600000005
                        ],
                        "id": "A2"
                    }
                ],
                "jobs": [
                    {
                        "requirements": [],
                        "time_windows": [],
                        "location": [
                            44.50932929564537,
                            40.18686625
                        ],
                        "pickup_amount": 10,
                        "id": "J1"
                    }
                ],
                "shipments": [
                    {
                        "requirements": [
                            "heavy-items"
                        ],
                        "pickup": {
                            "time_windows": [],
                            "location": [
                                44.50932929564531,
                                40.18686625
                            ]
                        },
                        "delivery": {
                            "time_windows": [],
                            "location": [
                                44.50932929564532,
                                40.18686625
                            ]
                        },
                        "id": "S1"
                    },
                    {
                        "requirements": [
                            "heavy-items"
                        ],
                        "pickup": {
                            "time_windows": [],
                            "location": [
                                44.511160727462574,
                                40.1816037
                            ]
                        },
                        "delivery": {
                            "time_windows": [],
                            "location": [
                                44.50932929564534,
                                40.18686625
                            ]
                        },
                        "id": "shipment-2"
                    },
                    {
                        "requirements": [
                            "small-items"
                        ],
                        "pickup": {
                            "time_windows": [],
                            "location": [
                                44.517954005538606,
                                40.18518455
                            ]
                        },
                        "delivery": {
                            "time_windows": [],
                            "location": [
                                44.50932929564537,
                                40.18686625
                            ]
                        },
                        "id": "shipment-3"
                    },
                    {
                        "requirements": [
                            "small-items"
                        ],
                        "pickup": {
                            "time_windows": [],
                            "location": [
                                44.5095432,
                                40.18665755000001
                            ]
                        },
                        "delivery": {
                            "time_windows": [],
                            "location": [
                                44.50932929564537,
                                40.18686625
                            ]
                        },
                        "id": "shipment-4"
                    },
                    {
                        "requirements": [
                            "small-items"
                        ],
                        "pickup": {
                            "time_windows": [],
                            "location": [
                                44.5095432,
                                40.18665755000001
                            ]
                        },
                        "delivery": {
                            "time_windows": [],
                            "location": [
                                44.50932929564537,
                                40.18686625
                            ]
                        },
                        "id": "shipment-5"
                    }
                ],
                "locations": [],
                "avoid": [],
                "mode": "drive"
            },
        };

        routePlannerResult = new RoutePlannerResult(options, RoutePlannerResultReverseConverter.convert(rawData));
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
        expect(routePlannerResult.getAgentSolution(0)).toEqual(new AgentSolution(rawData.agents[0]));
    });

    test("should return undefined for a non-existent agent solution", () => {
        expect(routePlannerResult.getAgentSolution("A2")).toBeUndefined();
    });

    test("should return waypoints for a specific agent", () => {
        expect(routePlannerResult.getAgentWaypoints("A1")).toEqual(rawData.agents[0].waypoints.map(waypoint => new Waypoint(waypoint)));
        expect(routePlannerResult.getAgentWaypoints(0)).toEqual(rawData.agents[0].waypoints.map(waypoint => new Waypoint(waypoint)));
    });

    test("should return an empty array for waypoints of a non-existent agent", () => {
        expect(routePlannerResult.getAgentWaypoints("A2")).toEqual([]);
        expect(routePlannerResult.getAgentWaypoints(1)).toEqual([]);
    });

    test("should return route actions for a specific agent", () => {
        expect(routePlannerResult.getAgentRouteActions("A1")).toEqual(rawData.agents[0].actions.map(action => new RouteAction(action)));
        expect(routePlannerResult.getAgentRouteActions(0)).toEqual(rawData.agents[0].actions.map(action => new RouteAction(action)));
    });

    test("should return an empty array for route actions of a non-existent agent", () => {
        expect(routePlannerResult.getAgentRouteActions("A2")).toEqual([]);
        expect(routePlannerResult.getAgentRouteActions(1)).toEqual([]);
    });

    test("should return route legs for a specific agent", () => {
        expect(routePlannerResult.getAgentRouteLegs("A1")).toEqual(rawData.agents[0].legs.map(leg => new RouteLeg(leg)));
        expect(routePlannerResult.getAgentRouteLegs(0)).toEqual(rawData.agents[0].legs.map(leg => new RouteLeg(leg)));
    });

    test("should return an empty array for route legs of a non-existent agent", () => {
        expect(routePlannerResult.getAgentRouteLegs("A2")).toEqual([]);
        expect(routePlannerResult.getAgentRouteLegs(1)).toEqual([]);
    });

    test("should return assigned jobs for a specific agent", () => {
        expect(routePlannerResult.getAgentJobs("A1")).toEqual([0]);
        expect(routePlannerResult.getAgentJobs(0)).toEqual([0]);
    });

    test("should return an empty array for assigned jobs of a non-existent agent", () => {
        expect(routePlannerResult.getAgentJobs("A2")).toEqual([]);
        expect(routePlannerResult.getAgentJobs(1)).toEqual([]);
    });

    test("should return assigned shipments for a specific agent", () => {
        expect(routePlannerResult.getAgentShipments("A1")).toEqual([0]);
        expect(routePlannerResult.getAgentShipments(0)).toEqual([0]);
    });

    test("should return an empty array for assigned shipments of a non-existent agent", () => {
        expect(routePlannerResult.getAgentShipments("A2")).toEqual([]);
        expect(routePlannerResult.getAgentShipments(1)).toEqual([]);
    });

    test("should return unassigned agents", () => {
        let unassignedAgents = routePlannerResult.getUnassignedAgents();
        expect(unassignedAgents.length).toBe(1);
        expect(unassignedAgents[1]).toBe(routePlannerResult.getData().inputData.agents[2])
    });

    test("should return unassigned jobs", () => {
        expect(routePlannerResult.getUnassignedJobs()).toEqual([routePlannerResult.getRawData().properties.params.jobs[3]]);
    });

    test("should return unassigned shipments", () => {
        expect(routePlannerResult.getUnassignedShipments()).toEqual([routePlannerResult.getRawData().properties.params.shipments[4],
            routePlannerResult.getRawData().properties.params.shipments[5]]);
    });

    test("should return job info when job exists", () => {
        expect(routePlannerResult.getJobInfo("J1")).toEqual(new RouteActionInfo({
            agentId: "A1",
            actions: [new RouteAction(rawData.agents[0].actions[0])],
            agent: new AgentSolution(rawData.agents[0]),
        }));
        expect(routePlannerResult.getJobInfo(0)).toEqual(new RouteActionInfo({
            agentId: "A1",
            actions: [new RouteAction(rawData.agents[0].actions[0])],
            agent: new AgentSolution(rawData.agents[0]),
        }));
    });

    test("should return null for a non-existent job", () => {
        expect(routePlannerResult.getJobInfo("J2")).toBeUndefined();
        expect(routePlannerResult.getJobInfo(1)).toBeUndefined();
    });

    test("should return shipment info when shipment exists", () => {
        expect(routePlannerResult.getShipmentInfo("S1")).toEqual(new RouteActionInfo({
            agentId: "A1",
            actions: [new RouteAction(rawData.agents[0].actions[0])],
            agent: new AgentSolution(rawData.agents[0]),
        }));
        expect(routePlannerResult.getShipmentInfo(0)).toEqual(new RouteActionInfo({
            agentId: "A1",
            actions: [new RouteAction(rawData.agents[0].actions[0])],
            agent: new AgentSolution(rawData.agents[0]),
        }));
    });

    test("should return null for a non-existent shipment", () => {
        expect(routePlannerResult.getShipmentInfo("S2")).toBeUndefined();
        expect(routePlannerResult.getShipmentInfo(1)).toBeUndefined();
    });

    test("should getAgentRoute() call routing API agent not found", async () => {
        routePlannerResult.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult.getAgentRoute("TESTING1", {mode: 'drive'});
        expect(result).toBeUndefined();
    });

    test("should getAgentRoute() call routing API success without waypoint", async () => {
        let rawData1 = JSON.parse(JSON.stringify(rawData));
        rawData1.agents[0].waypoints = [];
        let routePlannerResult1 = new RoutePlannerResult(options, RoutePlannerResultReverseConverter.convert(rawData1));
        routePlannerResult1.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult1.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult1.getAgentRoute("A1", {mode: 'drive'});
        expect(result).toBeUndefined();
    });

    test("should getAgentRoute() call routing API success with 1 waypoint", async () => {
        routePlannerResult.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult.getAgentRoute("A1", {mode: 'drive'});
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
        let routePlannerResult1 = new RoutePlannerResult(options, RoutePlannerResultReverseConverter.convert(rawData1));
        routePlannerResult1.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult1.getOptions().apiKey = TEST_API_KEY;
        let result = await routePlannerResult1.getAgentRoute("A1", {mode: 'drive'});
        expect(result.features.length).toBe(1);
    });

    test("should getAgentRoute() call routing API success with all options", async () => {
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
        let routePlannerResult1 = new RoutePlannerResult(options, RoutePlannerResultReverseConverter.convert(rawData1));
        routePlannerResult1.getOptions().baseUrl = 'https://api.geoapify.com';
        routePlannerResult1.getOptions().apiKey = TEST_API_KEY;
        let routingOptions: RoutingOptions = {
            mode: "drive",
            type: 'balanced',
            units: 'imperial',
            lang: 'es',
            avoid: ['tolls', 'highways'],
            details: ['instruction_details', 'route_details'],
            traffic: 'free_flow',
            max_speed: 100
        }
        let result = await routePlannerResult1.getAgentRoute("A1", routingOptions);
        expect(result.features.length).toBe(1);
    });
});
