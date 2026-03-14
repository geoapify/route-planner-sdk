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
});
