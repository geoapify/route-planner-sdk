import path from "path";
import fs from "fs";
import { RoutePlannerResultResponseData } from "../src";

export function loadJson(fileName: string): any {
    const filePath = path.join(__dirname, '',  fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function generateRawResponse(): RoutePlannerResultResponseData {
    return {
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
    }
}