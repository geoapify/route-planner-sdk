import { AgentTimeOffsetHelper } from "../../../../src/tools/route-editor/helpers/agent-time-offset-helper";

function createContextWithNoBreak() {
    const actions: any[] = [
        { type: "start", index: 0, start_time: 0, duration: 0, waypoint_index: 0 },
        { type: "job", index: 1, start_time: 10, duration: 5, waypoint_index: 1 },
        { type: "end", index: 2, start_time: 30, duration: 0, waypoint_index: 2 }
    ];

    const waypoints: any[] = [
        { start_time: 0, duration: 0, actions: [{ ...actions[0] }] },
        { start_time: 10, duration: 5, actions: [{ ...actions[1] }] },
        { start_time: 30, duration: 0, actions: [{ ...actions[2] }] }
    ];

    const feature: any = {
        properties: {
            agent_index: 0,
            actions,
            waypoints,
            legs: [
                { from_waypoint_index: 0, to_waypoint_index: 1, time: 10, distance: 1, steps: [] },
                { from_waypoint_index: 1, to_waypoint_index: 2, time: 20, distance: 1, steps: [] }
            ],
            end_time: 30
        }
    };

    const rawData: any = {
        features: [feature],
        properties: {
            params: {
                agents: [{}],
                jobs: [],
                shipments: []
            }
        }
    };

    const context: any = {
        getRawData: () => rawData,
        getAgentFeature: () => feature,
        getAgentActions: () => feature.properties.actions,
        getAgentWaypoints: () => feature.properties.waypoints
    };

    return { context, feature };
}

function createContextWithBreak() {
    const actions: any[] = [
        { type: "start", index: 0, start_time: 0, duration: 0, waypoint_index: 0 },
        { type: "break", index: 1, start_time: 10, duration: 5 },
        { type: "job", index: 2, start_time: 15, duration: 5, waypoint_index: 1 },
        { type: "end", index: 3, start_time: 30, duration: 0, waypoint_index: 2 }
    ];

    const waypoints: any[] = [
        { start_time: 0, duration: 0, actions: [{ ...actions[0] }] },
        { start_time: 15, duration: 5, actions: [{ ...actions[2] }] },
        { start_time: 30, duration: 0, actions: [{ ...actions[3] }] }
    ];

    const feature: any = {
        properties: {
            agent_index: 0,
            actions,
            waypoints,
            legs: [
                { from_waypoint_index: 0, to_waypoint_index: 1, time: 15, distance: 1, steps: [] },
                { from_waypoint_index: 1, to_waypoint_index: 2, time: 15, distance: 1, steps: [] }
            ],
            end_time: 30
        }
    };

    const rawData: any = {
        features: [feature],
        properties: {
            params: {
                agents: [{}],
                jobs: [],
                shipments: []
            }
        }
    };

    const context: any = {
        getRawData: () => rawData,
        getAgentFeature: () => feature,
        getAgentActions: () => feature.properties.actions,
        getAgentWaypoints: () => feature.properties.waypoints
    };

    return { context, feature };
}

describe("AgentTimeOffsetHelper", () => {
    test("adds a delay before waypointAfter+1 and shifts following actions", () => {
        const { context, feature } = createContextWithNoBreak();

        AgentTimeOffsetHelper.execute(context, 0, 0, 15);

        expect(feature.properties.waypoints[1].actions).toHaveLength(1);
        expect(feature.properties.waypoints[1].actions[0].type).toBe("job");
        expect(feature.properties.waypoints[1].actions[0].start_time).toBe(25);
        expect(feature.properties.waypoints[1].duration).toBe(5);
        expect(feature.properties.waypoints[1].start_time).toBe(25);
        expect(feature.properties.waypoints[2].start_time).toBe(45);

        expect(feature.properties.actions[1].type).toBe("delay");
        expect(feature.properties.actions[1].duration).toBe(15);
        expect(feature.properties.actions[1].waypoint_index).toBeUndefined();
        expect(feature.properties.actions[2].type).toBe("job");
        expect(feature.properties.actions[2].start_time).toBe(25);
        expect(feature.properties.actions.map((action: any) => action.index)).toEqual([0, 1, 2, 3]);

        expect(feature.properties.legs[0].time).toBe(10);
        expect(feature.properties.end_time).toBe(45);
    });

    test("does not touch existing break actions and adds a new delay action", () => {
        const { context, feature } = createContextWithBreak();

        AgentTimeOffsetHelper.execute(context, 0, 0, -10);

        expect(feature.properties.waypoints[1].actions).toHaveLength(1);
        expect(feature.properties.waypoints[1].actions[0].type).toBe("job");
        expect(feature.properties.waypoints[1].actions[0].start_time).toBe(5);
        expect(feature.properties.waypoints[1].duration).toBe(5);
        expect(feature.properties.waypoints[1].start_time).toBe(5);
        expect(feature.properties.waypoints[2].start_time).toBe(20);

        expect(feature.properties.actions[1].type).toBe("break");
        expect(feature.properties.actions[1].duration).toBe(5);
        expect(feature.properties.actions[2].type).toBe("delay");
        expect(feature.properties.actions[2].duration).toBe(-10);
        expect(feature.properties.actions[2].waypoint_index).toBeUndefined();
        expect(feature.properties.actions[3].start_time).toBe(5);
        expect(feature.properties.actions.map((action: any) => action.index)).toEqual([0, 1, 2, 3, 4]);
        expect(feature.properties.legs[0].time).toBe(15);
        expect(feature.properties.end_time).toBe(20);
    });

    test("reuses existing delay action on repeated calls", () => {
        const { context, feature } = createContextWithNoBreak();

        AgentTimeOffsetHelper.execute(context, 0, 0, 10);
        AgentTimeOffsetHelper.execute(context, 0, 0, -3);

        const delayActions = feature.properties.actions.filter((action: any) => action.type === "delay");
        expect(delayActions).toHaveLength(1);
        expect(delayActions[0].duration).toBe(7);
        expect(feature.properties.actions.map((action: any) => action.index)).toEqual([0, 1, 2, 3]);
    });

    test("removes delay action when resulting duration is zero", () => {
        const { context, feature } = createContextWithNoBreak();

        AgentTimeOffsetHelper.execute(context, 0, 0, 10);
        AgentTimeOffsetHelper.execute(context, 0, 0, -10);

        expect(feature.properties.actions.some((action: any) => action.type === "delay")).toBe(false);
        expect(feature.properties.actions.map((action: any) => action.index)).toEqual([0, 1, 2]);
        expect(feature.properties.waypoints[1].actions[0].index).toBe(1);
        expect(feature.properties.waypoints[2].actions[0].index).toBe(2);
    });

    test("does not change legs for negative delay", () => {
        const { context, feature } = createContextWithNoBreak();
        const legTimeBefore = feature.properties.legs[0].time;
        AgentTimeOffsetHelper.execute(context, 0, 0, -9);
        expect(feature.properties.legs[0].time).toBe(legTimeBefore);
        expect(feature.properties.actions[1].type).toBe("delay");
        expect(feature.properties.actions[1].duration).toBe(-9);
    });
});
