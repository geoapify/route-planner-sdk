import { RoutePlannerData } from "../../src";
import { Utils } from "../../src/tools/utils";

describe("Utils.cleanObject with RoutePlannerData", () => {
    test("should clean RoutePlannerData by removing empty arrays and undefined values", () => {
        const routePlannerData: RoutePlannerData = {
            mode: undefined,
            agents: [],
            jobs: [],
            shipments: [],
            locations: [],
            avoid: [],
            traffic: undefined,
            type: undefined,
            max_speed: 200,
            units: undefined,
        };

        expect(Utils.cleanObject(routePlannerData)).toEqual({
            max_speed: 200,
        });
    });

    test("should retain non-empty properties in RoutePlannerData", () => {
        const routePlannerData: RoutePlannerData = {
            mode: "drive",
            agents: [
                {
                    id: "A1",
                    capabilities: [],
                    time_windows: [],
                    breaks: []
                }
            ],
            jobs: [],
            shipments: [{ requirements: [] }],
            locations: [],
            avoid: [],
            traffic: "free_flow",
            type: "balanced",
            max_speed: 200,
            units: "metric",
        };

        expect(Utils.cleanObject(routePlannerData)).toEqual({
            mode: "drive",
            agents: [{ id: "A1" }],
            shipments: [],
            traffic: "free_flow",
            type: "balanced",
            max_speed: 200,
            units: "metric",
        });
    });

    test("should clean deeply nested RoutePlannerData with empty values", () => {
        const routePlannerData: RoutePlannerData = {
            mode: "drive",
            agents: [
                {
                    id: "A1",
                    capabilities: [],
                    time_windows: [],
                    breaks: []
                }
            ],
            jobs: [
                {
                    id: 'JobId',
                    requirements: [],
                    time_windows: [],
                },
            ],
            shipments: [],
            locations: [
                {
                    id: "L1",
                    location: [40.712776, -74.005974]
                },
            ],
            avoid: [],
            traffic: undefined,
            type: undefined,
            max_speed: undefined,
            units: undefined,
        };

        expect(Utils.cleanObject(routePlannerData)).toEqual({
            mode: "drive",
            agents: [{ id: "A1" }],
            jobs: [{id: 'JobId'}],
            locations: [
                {
                    id: "L1",
                    location: [40.712776, -74.005974],
                },
            ],
        });
    });

    test("should return undefined when all properties are empty", () => {
        const routePlannerData: RoutePlannerData = {
            mode: undefined,
            agents: [],
            jobs: [],
            shipments: [],
            locations: [],
            avoid: [],
            traffic: undefined,
            type: undefined,
            max_speed: undefined,
            units: undefined,
        };

        expect(Utils.cleanObject(routePlannerData)).toBeUndefined();
    });
});
