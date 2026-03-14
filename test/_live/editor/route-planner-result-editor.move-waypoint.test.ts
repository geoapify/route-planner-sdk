import { RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

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
});
