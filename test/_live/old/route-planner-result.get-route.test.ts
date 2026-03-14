import {
  RoutePlannerResultData,
  RoutingOptionsExtended
} from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { RoutePlannerCallOptions } from "../../../src/models/interfaces/route-planner-call-options";
import TEST_API_KEY from "../../../env-variables";
import { RoutePlannerResultReverseConverter } from "../../../route-planner-result-reverse-converter";

jest.setTimeout(120000);

describe("RoutePlannerResult getRoute (live)", () => {
  function createOptions(): RoutePlannerCallOptions {
    return {
      apiKey: TEST_API_KEY,
      baseUrl: "https://api.geoapify.com"
    };
  }

  function createRawData(): RoutePlannerResultData {
    return {
      agents: [
        {
          agentIndex: 0,
          agentId: "A1",
          time: 1000,
          start_time: 500,
          end_time: 2000,
          distance: 15000,
          mode: "drive",
          legs: [],
          actions: [],
          waypoints: [
            {
              original_location: [44.50932929564537, 40.18686625],
              original_location_index: 0,
              original_location_id: "1",
              location: [44.50932929564537, 40.18686625],
              start_time: 500,
              duration: 30,
              actions: [],
              prev_leg_index: undefined,
              next_leg_index: undefined
            }
          ]
        }
      ],
      unassignedAgents: [],
      unassignedJobs: [],
      unassignedShipments: [],
      inputData: {
        agents: [
          {
            id: "A1",
            start_location: [44.50932929564537, 40.18686625],
            time_windows: [],
            breaks: [],
            capabilities: []
          }
        ],
        jobs: [],
        shipments: [],
        locations: [],
        avoid: [],
        mode: "drive"
      }
    };
  }

  test("should return undefined for getRoute when no waypoints", async () => {
    const rawData = createRawData();
    rawData.agents[0].waypoints = [];

    const result = new RoutePlannerResult(createOptions(), RoutePlannerResultReverseConverter.convert(rawData));
    const route = await result.getAgentPlan("A1")?.getRoute({ mode: "drive" });

    expect(route).toBeUndefined();
  });

  test("should getRoute with 1 waypoint", async () => {
    const result = new RoutePlannerResult(createOptions(), RoutePlannerResultReverseConverter.convert(createRawData()));
    const route = await result.getAgentPlan("A1")?.getRoute({ mode: "drive" });

    expect(route?.properties).toBeDefined();
    // TODO: replace with strict assertion once expected 1-waypoint response contract is finalized.
  });

  test("should getRoute with 2 waypoints", async () => {
    const rawData = createRawData();
    rawData.agents[0].waypoints.push({
      original_location: [44.511160727462574, 40.1816037],
      original_location_index: 1,
      original_location_id: "2",
      location: [44.511160727462574, 40.1816037],
      start_time: 600,
      duration: 30,
      actions: [],
      prev_leg_index: 0,
      next_leg_index: undefined
    });

    const result = new RoutePlannerResult(createOptions(), RoutePlannerResultReverseConverter.convert(rawData));
    const route = await result.getAgentPlan("A1")?.getRoute({ mode: "drive" });

    expect(route?.properties).toBeDefined();
    expect(route?.properties?.units).toBeDefined();
  });

  test("should getRoute with extended routing options", async () => {
    const rawData = createRawData();
    rawData.agents[0].waypoints.push({
      original_location: [44.511160727462574, 40.1816037],
      original_location_index: 1,
      original_location_id: "2",
      location: [44.511160727462574, 40.1816037],
      start_time: 600,
      duration: 30,
      actions: [],
      prev_leg_index: 0,
      next_leg_index: undefined
    });

    const result = new RoutePlannerResult(createOptions(), RoutePlannerResultReverseConverter.convert(rawData));

    const routingOptions: RoutingOptionsExtended = {
      mode: "drive",
      type: "balanced",
      units: "imperial",
      lang: "es",
      avoid: [
        { type: "tolls", values: [] },
        { type: "highways", values: [] }
      ],
      details: ["instruction_details", "route_details"],
      traffic: "free_flow",
      max_speed: 100
    };

    const route = await result.getAgentPlan("A1")?.getRoute(routingOptions);

    expect(route?.properties).toBeDefined();
    expect(route?.properties?.units).toBeDefined();
  });
});
