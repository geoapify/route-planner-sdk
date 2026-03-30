import { RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, buildShipmentsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;
const JOBS_WITHOUT_BREAKS_INPUT_FILE =
    "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json";

function getBreakAndDelayDuration(feature: any): number {
    return (feature.properties.actions || [])
        .filter((action: any) => action.type === "break" || action.type === "delay")
        .reduce((sum: number, action: any) => sum + (action.duration || 0), 0);
}

function getWaypointSequence(feature: any): string[] {
    return (feature.properties.waypoints || []).map((waypoint: any) => {
        const actionKeys = (waypoint.actions || [])
            .map((action: any) => `${action.type}:${action.job_index ?? action.shipment_index ?? action.id ?? ""}`)
            .sort();
        return actionKeys.join("|");
    });
}

describe("RoutePlannerResultEditor.moveWaypoint (live)", () => {
    liveTest("should move waypoint within agent route", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const agentPlan = result.getAgentPlans().find(item => !!item && item.getWaypoints().length > 3);
        expect(agentPlan).toBeDefined();

        const agentIndex = agentPlan!.getAgentIndex();
        const waypointsBefore = editor.getModifiedResult().getAgentPlan(agentIndex)?.getWaypoints() || [];
        expect(waypointsBefore.length).toBeGreaterThan(3);

        await editor.moveWaypoint(agentIndex, 1, 2);

        const waypointsAfter = editor.getModifiedResult().getAgentPlan(agentIndex)?.getWaypoints() || [];
        expect(waypointsAfter.length).toBeGreaterThan(3);
    });

    liveTest("moveWaypoint + invalid agent id/index should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        await expect(editor.moveWaypoint("agent-does-not-exist", 1, 2)).rejects.toThrow();
        await expect(editor.moveWaypoint(999999, 1, 2)).rejects.toThrow();
    });

    liveTest("moveWaypoint + invalid fromWaypointIndex should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const agentPlan = result.getAgentPlans().find(item => !!item && item.getWaypoints().length > 3);
        expect(agentPlan).toBeDefined();

        const agentIndex = agentPlan!.getAgentIndex();
        const waypointsCount = agentPlan!.getWaypoints().length;

        await expect(editor.moveWaypoint(agentIndex, -1, 1)).rejects.toThrow();
        await expect(editor.moveWaypoint(agentIndex, waypointsCount, 1)).rejects.toThrow();
    });

    liveTest("moveWaypoint + invalid toWaypointIndex should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const agentPlan = result.getAgentPlans().find(item => !!item && item.getWaypoints().length > 3);
        expect(agentPlan).toBeDefined();

        const agentIndex = agentPlan!.getAgentIndex();
        const waypointsCount = agentPlan!.getWaypoints().length;

        await expect(editor.moveWaypoint(agentIndex, 1, -1)).rejects.toThrow();
        await expect(editor.moveWaypoint(agentIndex, 1, waypointsCount)).rejects.toThrow();
    });
    liveTest("moveWaypoint + from equals to should keep route unchanged", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const agentPlan = result.getAgentPlans().find(item => !!item && item.getWaypoints().length > 3);
        expect(agentPlan).toBeDefined();

        const agentIndex = agentPlan!.getAgentIndex();
        const beforeFeature = result.getRaw().features.find(
            (feature) => feature.properties.agent_index === agentIndex
        );
        expect(beforeFeature).toBeDefined();

        const fromWaypointIndex = beforeFeature!.properties.waypoints.findIndex((waypoint) =>
            !waypoint.actions.some((action) => action.type === "start" || action.type === "end")
        );
        expect(fromWaypointIndex).toBeGreaterThanOrEqual(0);

        const waypointsBefore = JSON.parse(JSON.stringify(beforeFeature!.properties.waypoints));
        const actionsBefore = JSON.parse(JSON.stringify(beforeFeature!.properties.actions));
        const legsBefore = JSON.parse(JSON.stringify(beforeFeature!.properties.legs));

        await editor.moveWaypoint(agentIndex, fromWaypointIndex, fromWaypointIndex);

        const afterFeature = editor.getModifiedResult().getRaw().features.find(
            (feature) => feature.properties.agent_index === agentIndex
        );
        expect(afterFeature).toBeDefined();
        expect(afterFeature!.properties.waypoints).toEqual(waypointsBefore);
        expect(afterFeature!.properties.actions).toEqual(actionsBefore);
        expect(afterFeature!.properties.legs).toEqual(legsBefore);
    });

    liveTest("moveWaypoint + moving start waypoint should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const agentPlan = result.getAgentPlans().find(item => !!item && item.getWaypoints().length > 3);
        expect(agentPlan).toBeDefined();

        const agentIndex = agentPlan!.getAgentIndex();
        const waypoints = agentPlan!.getWaypoints();

        const startWaypointIndex = waypoints.findIndex((waypoint) =>
            waypoint.getActions().some((action) => action.getType() === "start")
        );
        expect(startWaypointIndex).toBeGreaterThanOrEqual(0);

        const targetWaypointIndex = waypoints.findIndex((waypoint, index) =>
            index !== startWaypointIndex &&
            !waypoint.getActions().some((action) => action.getType() === "start" || action.getType() === "end")
        );
        expect(targetWaypointIndex).toBeGreaterThanOrEqual(0);

        await expect(editor.moveWaypoint(agentIndex, startWaypointIndex, targetWaypointIndex)).rejects.toThrow();
    });

    liveTest("moveWaypoint + moving end waypoint should throw", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const agentPlan = result.getAgentPlans().find(item => !!item && item.getWaypoints().length > 3);
        expect(agentPlan).toBeDefined();

        const agentIndex = agentPlan!.getAgentIndex();
        const waypoints = agentPlan!.getWaypoints();

        const endWaypointIndex = waypoints.findIndex((waypoint) =>
            waypoint.getActions().some((action) => action.getType() === "end")
        );
        expect(endWaypointIndex).toBeGreaterThanOrEqual(0);

        const targetWaypointIndex = waypoints.findIndex((waypoint, index) =>
            index !== endWaypointIndex &&
            !waypoint.getActions().some((action) => action.getType() === "start" || action.getType() === "end")
        );
        expect(targetWaypointIndex).toBeGreaterThanOrEqual(0);

        await expect(editor.moveWaypoint(agentIndex, endWaypointIndex, targetWaypointIndex)).rejects.toThrow();
    });
    liveTest("moveWaypoint + unassigned agent should throw", async () => {
        const result = await buildJobsResult();
        const raw = result.getRaw();
        const assignedAgentIndexes = new Set(raw.features.map((feature) => feature.properties.agent_index));

        let unassignedAgentIndex = raw.properties.params.agents.findIndex(
            (_, index) => !assignedAgentIndexes.has(index)
        );

        if (unassignedAgentIndex === -1) {
            unassignedAgentIndex = raw.features[0].properties.agent_index;
            raw.features = raw.features.filter(
                (feature) => feature.properties.agent_index !== unassignedAgentIndex
            );
        }

        const editor = new RoutePlannerResultEditor(result);
        await expect(editor.moveWaypoint(unassignedAgentIndex, 1, 2)).rejects.toThrow();
    });

    liveTest("moveWaypoint + should preserve pickup before delivery order", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);
        const raw = result.getRaw();

        let targetAgentIndex = -1;
        let pickupWaypointIndex = -1;
        let deliveryWaypointIndex = -1;

        for (const feature of raw.features) {
            const waypoints = feature.properties.waypoints;

            for (let currentDeliveryIndex = 0; currentDeliveryIndex < waypoints.length; currentDeliveryIndex++) {
                const deliveryWaypoint = waypoints[currentDeliveryIndex];
                const hasBoundaryAction = deliveryWaypoint.actions.some(
                    (action) => action.type === "start" || action.type === "end"
                );
                if (hasBoundaryAction) {
                    continue;
                }

                const deliveryAction = deliveryWaypoint.actions.find(
                    (action) => action.type === "delivery" && typeof action.shipment_index === "number"
                );
                if (!deliveryAction || deliveryAction.shipment_index === undefined) {
                    continue;
                }

                const currentPickupIndex = waypoints.findIndex((waypoint) => {
                    const hasBoundary = waypoint.actions.some(
                        (action) => action.type === "start" || action.type === "end"
                    );
                    if (hasBoundary) {
                        return false;
                    }
                    return waypoint.actions.some(
                        (action) =>
                            action.type === "pickup" &&
                            action.shipment_index === deliveryAction.shipment_index
                    );
                });

                if (currentPickupIndex !== -1 && currentPickupIndex < currentDeliveryIndex) {
                    targetAgentIndex = feature.properties.agent_index;
                    pickupWaypointIndex = currentPickupIndex;
                    deliveryWaypointIndex = currentDeliveryIndex;
                    break;
                }
            }

            if (targetAgentIndex !== -1) {
                break;
            }
        }

        expect(targetAgentIndex).toBeGreaterThanOrEqual(0);
        await expect(editor.moveWaypoint(targetAgentIndex, deliveryWaypointIndex, pickupWaypointIndex))
            .rejects
            .toThrow("before pickup");
    });

    liveTest("moveWaypoint + shipments + moving pickup waypoint after delivery should throw", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);
        const raw = result.getRaw();

        let targetAgentIndex = -1;
        let pickupWaypointIndex = -1;
        let deliveryWaypointIndex = -1;

        for (const feature of raw.features) {
            const waypoints = feature.properties.waypoints;

            for (let currentPickupIndex = 0; currentPickupIndex < waypoints.length; currentPickupIndex++) {
                const pickupWaypoint = waypoints[currentPickupIndex];
                const hasBoundaryAction = pickupWaypoint.actions.some(
                    (action) => action.type === "start" || action.type === "end"
                );
                if (hasBoundaryAction) {
                    continue;
                }

                const pickupAction = pickupWaypoint.actions.find(
                    (action) => action.type === "pickup" && typeof action.shipment_index === "number"
                );
                if (!pickupAction || pickupAction.shipment_index === undefined) {
                    continue;
                }

                const currentDeliveryIndex = waypoints.findIndex((waypoint) =>
                    waypoint.actions.some(
                        (action) =>
                            action.type === "delivery" &&
                            action.shipment_index === pickupAction.shipment_index
                    )
                );

                if (currentDeliveryIndex !== -1 && currentPickupIndex < currentDeliveryIndex) {
                    targetAgentIndex = feature.properties.agent_index;
                    pickupWaypointIndex = currentPickupIndex;
                    deliveryWaypointIndex = currentDeliveryIndex;
                    break;
                }
            }

            if (targetAgentIndex !== -1) {
                break;
            }
        }

        expect(targetAgentIndex).toBeGreaterThanOrEqual(0);
        await expect(editor.moveWaypoint(targetAgentIndex, pickupWaypointIndex, deliveryWaypointIndex))
            .rejects
            .toThrow();
    });

    liveTest("moveWaypoint + should merge adjacent waypoints with same location", async () => {
        const result = await buildJobsResult();
        const raw = result.getRaw();

        const targetFeature = raw.features.find((feature) => {
            const movableWaypoints = feature.properties.waypoints.filter(
                (waypoint) => !waypoint.actions.some((action) => action.type === "start" || action.type === "end")
            );
            return movableWaypoints.length >= 3;
        });
        expect(targetFeature).toBeDefined();

        const waypoints = targetFeature!.properties.waypoints;
        const movableWaypointIndexes = waypoints
            .map((waypoint, index) => ({ waypoint, index }))
            .filter(({ waypoint }) =>
                !waypoint.actions.some((action) => action.type === "start" || action.type === "end")
            )
            .map(({ index }) => index);

        expect(movableWaypointIndexes.length).toBeGreaterThanOrEqual(3);

        const targetWaypointIndex = movableWaypointIndexes[0];
        const sourceWaypointIndex = movableWaypointIndexes[2];
        const waypointsCountBefore = waypoints.length;
        const targetActionsBefore = waypoints[targetWaypointIndex].actions.length;
        const sourceActionsBefore = waypoints[sourceWaypointIndex].actions.length;

        const mergedLocation: [number, number] = [
            waypoints[targetWaypointIndex].original_location[0],
            waypoints[targetWaypointIndex].original_location[1]
        ];
        const mergedLocationIndex = 123456789;

        waypoints[targetWaypointIndex].original_location = [mergedLocation[0], mergedLocation[1]];
        waypoints[sourceWaypointIndex].original_location = [mergedLocation[0], mergedLocation[1]];
        waypoints[targetWaypointIndex].original_location_index = mergedLocationIndex;
        waypoints[sourceWaypointIndex].original_location_index = mergedLocationIndex;

        if (targetWaypointIndex > 0) {
            waypoints[targetWaypointIndex - 1].original_location_index = mergedLocationIndex + 1;
            waypoints[targetWaypointIndex - 1].original_location = [
                mergedLocation[0] + 0.001,
                mergedLocation[1] + 0.001
            ];
        }

        // Initialize editor after test data mutation so editor clone contains the prepared scenario.
        const editor = new RoutePlannerResultEditor(result);
        const agentIndex = targetFeature!.properties.agent_index;
        await editor.moveWaypoint(agentIndex, sourceWaypointIndex, targetWaypointIndex);

        const waypointsAfter = editor.getModifiedResult().getAgentPlan(agentIndex)?.getWaypoints() || [];
        expect(waypointsAfter.length).toBe(waypointsCountBefore - 1);
        expect(waypointsAfter[targetWaypointIndex].getActions().length).toBe(
            targetActionsBefore + sourceActionsBefore
        );
    });

    liveTest("moveWaypoint + move 3 waypoints further and move back should restore route", async () => {
        const result = await buildJobsResult(JOBS_WITHOUT_BREAKS_INPUT_FILE);
        const editor = new RoutePlannerResultEditor(result);
        const raw = result.getRaw();

        let targetAgentIndex = -1;
        let fromWaypointIndex = -1;
        let toWaypointIndex = -1;
        let movedWaypointJobIndexes: number[] = [];

        for (const feature of raw.features) {
            const waypoints = feature.properties.waypoints;
            if (waypoints.length < 7) {
                continue;
            }

            for (let index = 2; index < waypoints.length - 4; index++) {
                const candidateFrom = waypoints[index];
                const candidateTo = waypoints[index + 3];

                const hasBoundaryFrom = candidateFrom.actions.some(
                    (action) => action.type === "start" || action.type === "end"
                );
                const hasBoundaryTo = candidateTo.actions.some(
                    (action) => action.type === "start" || action.type === "end"
                );
                if (hasBoundaryFrom || hasBoundaryTo) {
                    continue;
                }

                const jobIndexes = candidateFrom.actions
                    .map((action) => action.job_index)
                    .filter((jobIndex): jobIndex is number => typeof jobIndex === "number");
                if (jobIndexes.length === 0) {
                    continue;
                }

                targetAgentIndex = feature.properties.agent_index;
                fromWaypointIndex = index;
                toWaypointIndex = index + 3;
                movedWaypointJobIndexes = jobIndexes;
                break;
            }

            if (targetAgentIndex !== -1) {
                break;
            }
        }

        expect(targetAgentIndex).toBeGreaterThanOrEqual(0);
        expect(fromWaypointIndex).toBeGreaterThanOrEqual(0);
        expect(toWaypointIndex).toBeGreaterThan(fromWaypointIndex);

        const beforeFeatureRaw = raw.features.find(
            (feature) => feature.properties.agent_index === targetAgentIndex
        );
        expect(beforeFeatureRaw).toBeDefined();
        const beforeFeature = JSON.parse(JSON.stringify(beforeFeatureRaw));

        const beforeWaypointsCount = beforeFeature.properties.waypoints.length;

        await editor.moveWaypoint(targetAgentIndex, fromWaypointIndex, toWaypointIndex);

        const afterMoveFeature = editor
            .getModifiedResult()
            .getRaw()
            .features.find((feature) => feature.properties.agent_index === targetAgentIndex);
        expect(afterMoveFeature).toBeDefined();
        expect(afterMoveFeature!.properties.waypoints.length).toBe(beforeWaypointsCount);

        const afterBreakAndDelayDuration = getBreakAndDelayDuration(afterMoveFeature);
        expect(afterBreakAndDelayDuration).toBe(0);

        const movedWaypointIndexAfter = afterMoveFeature!.properties.waypoints.findIndex((waypoint) =>
            movedWaypointJobIndexes.every((jobIndex) =>
                waypoint.actions.some((action) => action.job_index === jobIndex)
            )
        );
        expect(movedWaypointIndexAfter).toBe(toWaypointIndex);

        await editor.moveWaypoint(targetAgentIndex, toWaypointIndex, fromWaypointIndex);

        const afterMoveBackFeature = editor
            .getModifiedResult()
            .getRaw()
            .features.find((feature) => feature.properties.agent_index === targetAgentIndex);
        expect(afterMoveBackFeature).toBeDefined();
        expect(afterMoveBackFeature!.properties.waypoints.length).toBe(beforeWaypointsCount);

        const beforeWaypointSequence = getWaypointSequence(beforeFeature);
        const afterMoveBackWaypointSequence = getWaypointSequence(afterMoveBackFeature);
        expect(afterMoveBackWaypointSequence).toEqual(beforeWaypointSequence);
    });
});
