import { RoutePlannerOptions } from "../../src/models/interfaces/route-planner-options";
import { RoutePlannerInputData, RoutePlannerResultResponseData } from "../../src";
import { RoutePlannerResult } from "../../src/models/entities/route-planner-result";
import { RoutePlannerResultConverter } from "../../src/tools/route-planner-result-converter";

describe("RoutePlannerResultConverter", () => {
  test("should convert the data properly", async () => {
    const options: RoutePlannerOptions = {
      apiKey: "API_KEY",
      baseUrl: "BASE_URL",
      httpOptions: {
        header1: {
          key: "header1Key",
        },
      },
    };

    const routePlannerData: RoutePlannerInputData = {
      mode: undefined,
      agents: [],
      jobs: [],
      shipments: [],
      locations: [],
      avoid: [],
      traffic: undefined,
      type: undefined,
      max_speed: 200,
      units: "metric",
    };

    const routePlannerResultResponseData: RoutePlannerResultResponseData = {
      type: "FeatureCollection",
      properties: {
        mode: "driving",
        params: {
          mode: "driving",
          agents: [],
          jobs: [],
          shipments: [],
          locations: [],
          avoid: [],
          traffic: "heavy",
          type: "fastest",
          max_speed: 200,
          units: "metric",
        },
        issues: {
          unassigned_agents: [1, 2],
          unassigned_jobs: [3],
          unassigned_shipments: [4, 5],
        },
      },
      features: [
        {
          geometry: {
            type: "LineString",
            coordinates: [
              [40.712776, -74.005974],
              [34.052235, -118.243683],
            ],
          },
          type: "Feature",
          properties: {
            agent_index: 1,
            agent_id: "A1",
            time: 1000,
            start_time: 500,
            end_time: 2000,
            distance: 15000,
            mode: "driving",
            legs: undefined,
            actions: [
              {
                type: "pickup",
                start_time: 100,
                duration: 50,
                shipment_index: 1,
                shipment_id: "S1",
                location_index: 2,
                location_id: "10",
                job_index: 3,
                job_id: "J1",
                index: 5,
                waypoint_index: 0,
              },
            ],
            waypoints: [
              {
                original_location: [40.712776, -74.005974],
                original_location_index: 0,
                original_location_id: 100,
                location: [34.052235, -118.243683],
                start_time: 500,
                duration: 100,
                actions: [
                  {
                    type: "dropoff",
                    start_time: 600,
                    duration: 30,
                    shipment_index: 2,
                    shipment_id: "S2",
                    location_index: 1,
                    location_id: "101",
                    job_index: 4,
                    job_id: "J2",
                    index: 6,
                    waypoint_index: 1,
                  },
                ],
                prev_leg_index: 0,
                next_leg_index: 1,
              },
            ],
          },
        },
      ],
    };

    const result = RoutePlannerResultConverter.convert(
        options,
        routePlannerData,
        routePlannerResultResponseData
    );

    expect(result).toBeInstanceOf(RoutePlannerResult);
    expect(result.getOptions()).toEqual(options);
    expect(result.getData().inputData).toEqual(routePlannerData);
    expect(result.getData().unassignedAgents).toEqual([1, 2]);
    expect(result.getData().unassignedJobs).toEqual([3]);
    expect(result.getData().unassignedShipments).toEqual([4, 5]);
    expect(result.getData().agents.length).toBe(1);
    expect(result.getData().agents[0].agentIndex).toBe(1);
    expect(result.getData().agents[0].agentId).toBe("A1");
    expect(result.getData().agents[0].time).toBe(1000);
    expect(result.getData().agents[0].legs.length).toBe(0);
    expect(result.getData().agents[0].waypoints.length).toBe(1);
    expect(result.getData().agents[0].waypoints[0].original_location).toEqual([
      40.712776, -74.005974,
    ]);
    expect(result.getData().agents[0].waypoints[0].location).toEqual([
      34.052235, -118.243683,
    ]);
    expect(result.getData().agents[0].waypoints[0].actions.length).toBe(1);
    expect(result.getData().agents[0].waypoints[0].actions[0].type).toBe("dropoff");
  });
});
