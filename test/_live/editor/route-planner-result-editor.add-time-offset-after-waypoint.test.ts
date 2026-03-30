import { RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

function getFirstWaypointActionGlobalIndex(feature: any, waypointIndex: number): number {
    const waypointActions = feature.properties.waypoints[waypointIndex].actions;
    expect(waypointActions.length).toBeGreaterThan(0);
    const firstWaypointActionIndex = waypointActions[0].index;
    const globalIndex = feature.properties.actions.findIndex((action: any) => action.index === firstWaypointActionIndex);
    expect(globalIndex).toBeGreaterThanOrEqual(0);
    return globalIndex;
}

function expectDelayBetweenWaypoints(feature: any, waypointAfterIndex: number): void {
    const nextWaypointIndex = waypointAfterIndex + 1;
    const firstNextWaypointGlobalIndex = getFirstWaypointActionGlobalIndex(feature, nextWaypointIndex);
    expect(firstNextWaypointGlobalIndex).toBeGreaterThan(0);

    const delayAction = feature.properties.actions[firstNextWaypointGlobalIndex - 1];
    expect(delayAction).toBeDefined();
    expect(delayAction.type).toBe("delay");

    const isInWaypointActions = feature.properties.waypoints.some((waypoint: any) =>
        waypoint.actions.some((action: any) => action.index === delayAction.index)
    );
    expect(isInWaypointActions).toBe(false);
}

describe("RoutePlannerResultEditor.addDelayAfterWaypoint (live)", () => {
    liveTest("should apply delay after waypoint", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const firstAssignedAgent = result.getAgentPlans().find(agentPlan => !!agentPlan);
        expect(firstAssignedAgent).toBeDefined();

        const agentIndex = firstAssignedAgent!.getAgentIndex();
        const before = editor.getModifiedResult().getAgentPlan(agentIndex)?.getWaypoints()?.[1]?.getStartTime() || 0;
        editor.addDelayAfterWaypoint(agentIndex, 0, 30);
        const after = editor.getModifiedResult().getAgentPlan(agentIndex)?.getWaypoints()?.[1]?.getStartTime() || 0;

        expect(after).toBe(before + 30);
    });

    liveTest("addDelayAfterWaypoint + multiple waypoints affected", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const delaySeconds = 45;

        const candidateAgentPlan = result.getAgentPlans().find(
            (agentPlan) => !!agentPlan && agentPlan.getWaypoints().length >= 3
        );
        expect(candidateAgentPlan).toBeDefined();

        const agentIndex = candidateAgentPlan!.getAgentIndex();
        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(beforeFeature).toBeDefined();

        const waypointsCount = beforeFeature!.properties.waypoints.length;
        const waypointIndex = waypointsCount >= 4 ? 1 : 0;

        const beforeWaypointStarts = beforeFeature!.properties.waypoints.map((waypoint) => waypoint.start_time);
        const beforeActionStartsByWaypoint = beforeFeature!.properties.waypoints.map((waypoint) =>
            waypoint.actions.map((action) => action.start_time)
        );
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));
        const beforeEndTime = beforeFeature!.properties.end_time;

        editor.addDelayAfterWaypoint(agentIndex, waypointIndex, delaySeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        let affectedWaypoints = 0;
        for (let i = 0; i < afterFeature!.properties.waypoints.length; i++) {
            const expectedDelta = i > waypointIndex ? delaySeconds : 0;
            const beforeStartTime = beforeWaypointStarts[i];
            const afterStartTime = afterFeature!.properties.waypoints[i].start_time;
            expect(afterStartTime).toBe(beforeStartTime + expectedDelta);

            if (expectedDelta !== 0) {
                affectedWaypoints++;
            }

            const beforeWaypointActionStarts = beforeActionStartsByWaypoint[i];
            const afterWaypointActionStarts = afterFeature!.properties.waypoints[i].actions.map((action) => action.start_time);
            expect(afterWaypointActionStarts).toHaveLength(beforeWaypointActionStarts.length);
            for (let actionIndex = 0; actionIndex < afterWaypointActionStarts.length; actionIndex++) {
                expect(afterWaypointActionStarts[actionIndex]).toBe(beforeWaypointActionStarts[actionIndex] + expectedDelta);
            }
        }

        expect(affectedWaypoints).toBeGreaterThanOrEqual(2);

        expect(afterFeature!.properties.legs).toEqual(beforeLegs);

        expect(afterFeature!.properties.end_time).toBe(beforeEndTime + delaySeconds);
    });

    liveTest("addDelayAfterWaypoint + positive then same negative delay restores original result", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const delaySeconds = 30;

        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find(
            (feature) => feature.properties.legs?.some((leg) => (leg.time || 0) > delaySeconds)
        );
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const legForOffset = beforeFeature!.properties.legs.find((leg) => (leg.time || 0) > delaySeconds);
        expect(legForOffset).toBeDefined();
        const waypointIndex = legForOffset!.from_waypoint_index;

        const beforeWaypoints = JSON.parse(JSON.stringify(beforeFeature!.properties.waypoints));
        const beforeActions = JSON.parse(JSON.stringify(beforeFeature!.properties.actions));
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));
        const beforeEndTime = beforeFeature!.properties.end_time;
        const beforeAgentViolations = (editor.getModifiedResult().getAgentPlan(agentIndex)?.getViolations() || [])
            .map((v) => `${v.name}:${v.message}`)
            .sort();

        editor.addDelayAfterWaypoint(agentIndex, waypointIndex, delaySeconds);
        editor.addDelayAfterWaypoint(agentIndex, waypointIndex, -delaySeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        expect(afterFeature!.properties.waypoints).toEqual(beforeWaypoints);
        expect(afterFeature!.properties.actions).toEqual(beforeActions);
        expect(afterFeature!.properties.legs).toEqual(beforeLegs);
        expect(afterFeature!.properties.end_time).toBe(beforeEndTime);

        const afterAgentViolations = (editor.getModifiedResult().getAgentPlan(agentIndex)?.getViolations() || [])
            .map((v) => `${v.name}:${v.message}`)
            .sort();
        expect(afterAgentViolations).toEqual(beforeAgentViolations);
    });
    liveTest("addDelayAfterWaypoint + delay=0 keeps plan unchanged", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find((feature) => feature.properties.waypoints?.length > 1);
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const waypointIndex = 0;

        const beforeWaypoints = JSON.parse(JSON.stringify(beforeFeature!.properties.waypoints));
        const beforeActions = JSON.parse(JSON.stringify(beforeFeature!.properties.actions));
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));
        const beforeEndTime = beforeFeature!.properties.end_time;
        const beforeAgentViolations = (editor.getModifiedResult().getAgentPlan(agentIndex)?.getViolations() || [])
            .map((v) => `${v.name}:${v.message}`)
            .sort();

        editor.addDelayAfterWaypoint(agentIndex, waypointIndex, 0);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        expect(afterFeature!.properties.waypoints).toEqual(beforeWaypoints);
        expect(afterFeature!.properties.actions).toEqual(beforeActions);
        expect(afterFeature!.properties.legs).toEqual(beforeLegs);
        expect(afterFeature!.properties.end_time).toBe(beforeEndTime);

        const afterAgentViolations = (editor.getModifiedResult().getAgentPlan(agentIndex)?.getViolations() || [])
            .map((v) => `${v.name}:${v.message}`)
            .sort();
        expect(afterAgentViolations).toEqual(beforeAgentViolations);
    });
    liveTest("addDelayAfterWaypoint + negative delay", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find((feature) => feature.properties.waypoints.length >= 3);
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const waypointIndex = 0;
        const delaySeconds = -30;

        const beforeWaypointStarts = beforeFeature!.properties.waypoints.map((waypoint) => waypoint.start_time);
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));
        const beforeEndTime = beforeFeature!.properties.end_time;

        editor.addDelayAfterWaypoint(agentIndex, waypointIndex, delaySeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        for (let i = 0; i < afterFeature!.properties.waypoints.length; i++) {
            const expectedDelta = i > waypointIndex ? delaySeconds : 0;
            expect(afterFeature!.properties.waypoints[i].start_time).toBe(beforeWaypointStarts[i] + expectedDelta);
        }

        expect(afterFeature!.properties.legs).toEqual(beforeLegs);
        expect(afterFeature!.properties.end_time).toBe(beforeEndTime + delaySeconds);
    });
    liveTest("addDelayAfterWaypoint + negative delay keeps legs unchanged", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find((feature) => feature.properties.waypoints.length >= 3);
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const waypointIndex = 0;
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));
        const delaySeconds = -100000;
        editor.addDelayAfterWaypoint(agentIndex, waypointIndex, delaySeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();
        expect(afterFeature!.properties.legs).toEqual(beforeLegs);
    });

    liveTest("addDelayAfterWaypoint + delay from middle does not change waypoints before index", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const delaySeconds = 60;

        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find((feature) => feature.properties.waypoints.length >= 4);
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const waypointIndex = 1;

        const beforeWaypointStarts = beforeFeature!.properties.waypoints.map((waypoint) => waypoint.start_time);
        const beforeWaypointActionStarts = beforeFeature!.properties.waypoints.map((waypoint) =>
            waypoint.actions.map((action) => action.start_time)
        );

        editor.addDelayAfterWaypoint(agentIndex, waypointIndex, delaySeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        for (let i = 0; i <= waypointIndex; i++) {
            expect(afterFeature!.properties.waypoints[i].start_time).toBe(beforeWaypointStarts[i]);
            const afterActionStarts = afterFeature!.properties.waypoints[i].actions.map((action) => action.start_time);
            expect(afterActionStarts).toEqual(beforeWaypointActionStarts[i]);
        }
    });

    liveTest("addDelayAfterWaypoint + adds delay after provided waypoint and before next waypoint", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const delaySeconds = 90;

        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find((feature: any) =>
            feature.properties.waypoints.length >= 3 &&
            !feature.properties.actions.some((action: any) => action.type === "delay")
        );
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const beforeActionsCount = beforeFeature!.properties.actions.length;
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));

        editor.addDelayAfterWaypoint(agentIndex, 0, delaySeconds);

        const afterFeature = editor.getModifiedResult().getRaw().features.find(
            (feature: any) => feature.properties.agent_index === agentIndex
        );
        expect(afterFeature).toBeDefined();

        expect(afterFeature!.properties.actions.length).toBe(beforeActionsCount + 1);
        expectDelayBetweenWaypoints(afterFeature, 0);

        const firstWaypoint1GlobalIndex = getFirstWaypointActionGlobalIndex(afterFeature, 1);
        const insertedDelay = afterFeature!.properties.actions[firstWaypoint1GlobalIndex - 1];
        expect(insertedDelay.duration).toBe(delaySeconds);

        // Delay-based shifting should not mutate route leg travel times.
        expect(afterFeature!.properties.legs).toEqual(beforeLegs);
    });

    liveTest("addDelayAfterWaypoint + different positions add multiple delays and keep legs unchanged", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const beforeRaw = result.getRaw();
        const beforeFeature = beforeRaw.features.find((feature: any) =>
            feature.properties.waypoints.length >= 4 &&
            !feature.properties.actions.some((action: any) => action.type === "delay")
        );
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const beforeActionsCount = beforeFeature!.properties.actions.length;
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));

        editor.addDelayAfterWaypoint(agentIndex, 0, 30);
        editor.addDelayAfterWaypoint(agentIndex, 1, 45);

        const afterFeature = editor.getModifiedResult().getRaw().features.find(
            (feature: any) => feature.properties.agent_index === agentIndex
        );
        expect(afterFeature).toBeDefined();

        expect(afterFeature!.properties.actions.length).toBe(beforeActionsCount + 2);
        expectDelayBetweenWaypoints(afterFeature, 0);
        expectDelayBetweenWaypoints(afterFeature, 1);

        const firstWaypoint1GlobalIndex = getFirstWaypointActionGlobalIndex(afterFeature, 1);
        const firstInsertedDelay = afterFeature!.properties.actions[firstWaypoint1GlobalIndex - 1];
        expect(firstInsertedDelay.duration).toBe(30);

        const firstWaypoint2GlobalIndex = getFirstWaypointActionGlobalIndex(afterFeature, 2);
        const secondInsertedDelay = afterFeature!.properties.actions[firstWaypoint2GlobalIndex - 1];
        expect(secondInsertedDelay.duration).toBe(45);

        // Delay-based shifting should not mutate route leg travel times.
        expect(afterFeature!.properties.legs).toEqual(beforeLegs);
    });

    liveTest("addDelayAfterWaypoint + invalid agent id/index should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        expect(() => editor.addDelayAfterWaypoint("agent-does-not-exist", 0, 30)).toThrow();
        expect(() => editor.addDelayAfterWaypoint(999999, 0, 30)).toThrow();
    });

    liveTest("addDelayAfterWaypoint + invalid waypoint index should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const firstAssignedAgent = result.getAgentPlans().find(agentPlan => !!agentPlan);
        expect(firstAssignedAgent).toBeDefined();

        const agentIndex = firstAssignedAgent!.getAgentIndex();
        expect(() => editor.addDelayAfterWaypoint(agentIndex, -1, 30)).toThrow();
        expect(() => editor.addDelayAfterWaypoint(agentIndex, 999999, 30)).toThrow();
    });

    liveTest("addDelayAfterWaypoint + unassigned agent should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const raw = result.getRaw();
        const assignedAgentIndexes = new Set<number>(raw.features.map((feature) => feature.properties.agent_index));
        let unassignedAgentIndex = raw.properties.params.agents.findIndex((_: any, index: number) => !assignedAgentIndexes.has(index));

        if (unassignedAgentIndex === -1) {
            raw.properties.params.agents.push({
                capabilities: [],
                time_windows: [],
                breaks: []
            });
            unassignedAgentIndex = raw.properties.params.agents.length - 1;
        }

        expect(() => editor.addDelayAfterWaypoint(unassignedAgentIndex, 0, 30)).toThrow();
    });
});
