import { RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.removeJobs (live)", () => {
    liveTest("should remove a job from assignment", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedJob = result.getJobPlans().find(jobPlan => jobPlan.getAgentIndex() !== undefined);
        expect(assignedJob).toBeDefined();

        await editor.removeJobs([assignedJob!.getJobIndex()]);

        const modified = editor.getModifiedResult();
        expect(modified.getJobPlan(assignedJob!.getJobIndex())?.getAgentIndex()).toBeUndefined();
    });
});
