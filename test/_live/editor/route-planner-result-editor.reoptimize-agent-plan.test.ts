import { RoutePlannerResultEditor } from "../../../src";
import { buildShipmentsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.reoptimizeAgentPlan (live)", () => {
    liveTest("should reoptimize target agent plan", async () => {
        const result = await buildShipmentsResult();
        const editor = new RoutePlannerResultEditor(result);
        const firstAssignedAgent = result.getAgentPlans().find(agentPlan => !!agentPlan);
        expect(firstAssignedAgent).toBeDefined();

        const success = await editor.reoptimizeAgentPlan({
            agentIdOrIndex: firstAssignedAgent!.getAgentIndex(),
            includeUnassigned: true,
            allowViolations: true
        });

        expect(success).toBe(true);
        expect(editor.getModifiedResult()).toBeDefined();
    });
});
