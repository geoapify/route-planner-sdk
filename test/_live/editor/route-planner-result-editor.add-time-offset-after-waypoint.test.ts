import { RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.addTimeOffsetAfterWaypoint (live)", () => {
    liveTest("should apply offset after waypoint", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const firstAssignedAgent = result.getAgentPlans().find(agentPlan => !!agentPlan);
        expect(firstAssignedAgent).toBeDefined();

        const agentIndex = firstAssignedAgent!.getAgentIndex();
        const before = editor.getModifiedResult().getAgentPlan(agentIndex)?.getWaypoints()?.[1]?.getStartTime() || 0;
        editor.addTimeOffsetAfterWaypoint(agentIndex, 0, 30);
        const after = editor.getModifiedResult().getAgentPlan(agentIndex)?.getWaypoints()?.[1]?.getStartTime() || 0;

        expect(after).toBe(before + 30);
    });

    liveTest("addTimeOffsetAfterWaypoint + multiple waypoints affected", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const offsetSeconds = 45;

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
        const beforeLegTime = beforeFeature!.properties.legs.find((leg) => leg.from_waypoint_index === waypointIndex)?.time;
        const beforeEndTime = beforeFeature!.properties.end_time;

        editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, offsetSeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        let affectedWaypoints = 0;
        for (let i = 0; i < afterFeature!.properties.waypoints.length; i++) {
            const expectedDelta = i > waypointIndex ? offsetSeconds : 0;
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

        const afterLeg = afterFeature!.properties.legs.find((leg) => leg.from_waypoint_index === waypointIndex);
        if (beforeLegTime !== undefined) {
            expect(afterLeg).toBeDefined();
            expect(afterLeg!.time).toBe(beforeLegTime + offsetSeconds);
        }

        expect(afterFeature!.properties.end_time).toBe(beforeEndTime + offsetSeconds);
    });
    
    liveTest("addTimeOffsetAfterWaypoint + positive then same negative offset restores original result", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const offsetSeconds = 30;

        const beforeRaw = editor.getModifiedResult().getRaw();
        const beforeFeature = beforeRaw.features.find(
            (feature) => feature.properties.legs?.some((leg) => (leg.time || 0) > offsetSeconds)
        );
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const legForOffset = beforeFeature!.properties.legs.find((leg) => (leg.time || 0) > offsetSeconds);
        expect(legForOffset).toBeDefined();
        const waypointIndex = legForOffset!.from_waypoint_index;

        const beforeWaypoints = JSON.parse(JSON.stringify(beforeFeature!.properties.waypoints));
        const beforeActions = JSON.parse(JSON.stringify(beforeFeature!.properties.actions));
        const beforeLegs = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));
        const beforeEndTime = beforeFeature!.properties.end_time;
        const beforeAgentViolations = (editor.getModifiedResult().getAgentPlan(agentIndex)?.getViolations() || [])
            .map((v) => `${v.name}:${v.message}`)
            .sort();

        editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, offsetSeconds);
        editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, -offsetSeconds);

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
    liveTest("addTimeOffsetAfterWaypoint + offset=0 keeps plan unchanged", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const beforeRaw = editor.getModifiedResult().getRaw();
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

        editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, 0);

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
    liveTest("addTimeOffsetAfterWaypoint + negative offset that keeps leg positive", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const beforeRaw = editor.getModifiedResult().getRaw();
        const beforeFeature = beforeRaw.features.find((feature) =>
            feature.properties.legs?.some((leg) => (leg.time || 0) > 1)
        );
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const legForOffset = beforeFeature!.properties.legs.find((leg) => (leg.time || 0) > 1);
        expect(legForOffset).toBeDefined();

        const waypointIndex = legForOffset!.from_waypoint_index;
        const beforeLegTime = legForOffset!.time;
        const offsetSeconds = -Math.min(30, beforeLegTime - 1);

        const beforeWaypointStarts = beforeFeature!.properties.waypoints.map((waypoint) => waypoint.start_time);
        const beforeEndTime = beforeFeature!.properties.end_time;

        editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, offsetSeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        const afterLeg = afterFeature!.properties.legs.find((leg) => leg.from_waypoint_index === waypointIndex);
        expect(afterLeg).toBeDefined();
        expect(afterLeg!.time).toBe(beforeLegTime + offsetSeconds);
        expect(afterLeg!.time).toBeGreaterThan(0);

        for (let i = 0; i < afterFeature!.properties.waypoints.length; i++) {
            const expectedDelta = i > waypointIndex ? offsetSeconds : 0;
            expect(afterFeature!.properties.waypoints[i].start_time).toBe(beforeWaypointStarts[i] + expectedDelta);
        }

        expect(afterFeature!.properties.end_time).toBe(beforeEndTime + offsetSeconds);
    });
    liveTest("addTimeOffsetAfterWaypoint + negative offset causing non-positive leg should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const beforeRaw = editor.getModifiedResult().getRaw();
        const beforeFeature = beforeRaw.features.find((feature) =>
            feature.properties.legs?.some((leg) => (leg.time || 0) > 0)
        );
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const legForOffset = beforeFeature!.properties.legs.find((leg) => (leg.time || 0) > 0);
        expect(legForOffset).toBeDefined();

        const waypointIndex = legForOffset!.from_waypoint_index;
        const beforeLegTime = legForOffset!.time;
        const invalidOffset = -beforeLegTime;

        expect(() => editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, invalidOffset))
            .toThrow(/Leg time must stay positive/);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();
        const afterLeg = afterFeature!.properties.legs.find((leg) => leg.from_waypoint_index === waypointIndex);
        expect(afterLeg).toBeDefined();
        expect(afterLeg!.time).toBe(beforeLegTime);
    });

    liveTest("addTimeOffsetAfterWaypoint + offset from middle does not change waypoints before index", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const offsetSeconds = 60;

        const beforeRaw = editor.getModifiedResult().getRaw();
        const beforeFeature = beforeRaw.features.find((feature) => feature.properties.waypoints.length >= 4);
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const waypointIndex = 1;

        const beforeWaypointStarts = beforeFeature!.properties.waypoints.map((waypoint) => waypoint.start_time);
        const beforeWaypointActionStarts = beforeFeature!.properties.waypoints.map((waypoint) =>
            waypoint.actions.map((action) => action.start_time)
        );

        editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, offsetSeconds);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        for (let i = 0; i <= waypointIndex; i++) {
            expect(afterFeature!.properties.waypoints[i].start_time).toBe(beforeWaypointStarts[i]);
            const afterActionStarts = afterFeature!.properties.waypoints[i].actions.map((action) => action.start_time);
            expect(afterActionStarts).toEqual(beforeWaypointActionStarts[i]);
        }
    });

    liveTest("addTimeOffsetAfterWaypoint + large positive offset preserves waypoint/action ordering", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);
        const largeOffset = 3600;

        const beforeRaw = editor.getModifiedResult().getRaw();
        const beforeFeature = beforeRaw.features.find((feature) => feature.properties.waypoints.length >= 3);
        expect(beforeFeature).toBeDefined();

        const agentIndex = beforeFeature!.properties.agent_index;
        const waypointIndex = 0;

        const beforeWaypointActionTypes = beforeFeature!.properties.waypoints.map((waypoint) =>
            waypoint.actions.map((action) => action.type)
        );
        const beforeGlobalActionKeys = beforeFeature!.properties.actions.map((action) =>
            `${action.type}:${action.job_index ?? "na"}:${action.shipment_index ?? "na"}:${action.index}`
        );

        editor.addTimeOffsetAfterWaypoint(agentIndex, waypointIndex, largeOffset);

        const afterRaw = editor.getModifiedResult().getRaw();
        const afterFeature = afterRaw.features.find((feature) => feature.properties.agent_index === agentIndex);
        expect(afterFeature).toBeDefined();

        const afterWaypointActionTypes = afterFeature!.properties.waypoints.map((waypoint) =>
            waypoint.actions.map((action) => action.type)
        );
        const afterGlobalActionKeys = afterFeature!.properties.actions.map((action) =>
            `${action.type}:${action.job_index ?? "na"}:${action.shipment_index ?? "na"}:${action.index}`
        );

        expect(afterWaypointActionTypes).toEqual(beforeWaypointActionTypes);
        expect(afterGlobalActionKeys).toEqual(beforeGlobalActionKeys);

        const actionStartTimes = afterFeature!.properties.actions.map((action) => action.start_time);
        for (let i = 1; i < actionStartTimes.length; i++) {
            expect(actionStartTimes[i]).toBeGreaterThanOrEqual(actionStartTimes[i - 1]);
        }
    });
    test.todo("addTimeOffsetAfterWaypoint + invalid agent id/index should throw");
    test.todo("addTimeOffsetAfterWaypoint + invalid waypoint index should throw");
    test.todo("addTimeOffsetAfterWaypoint + unassigned agent should throw");
});
