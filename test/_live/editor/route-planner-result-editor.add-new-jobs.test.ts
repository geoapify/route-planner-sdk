import { Job, RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.addNewJobs (live)", () => {
    liveTest("should add and assign a new job", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const newJobId = "job-live-new";
        const newJob = new Job()
            .setId(newJobId)
            .setLocation(13.426, 52.523)
            .setDuration(60)
            .setPickupAmount(5);

        await editor.addNewJobs(0, [newJob]);

        const modified = editor.getModifiedResult();
        expect(modified.getJobPlan(newJobId)).toBeDefined();
        expect(modified.getJobPlan(newJobId)?.getAgentIndex()).toBe(0);
    });
});
