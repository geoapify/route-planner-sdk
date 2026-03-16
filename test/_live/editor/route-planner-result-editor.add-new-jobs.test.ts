import { Job, PRESERVE_ORDER, REOPTIMIZE, RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.addNewJobs (live)", () => {

    liveTest("addNewJobs + preserveOrder + without position", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const targetPlanBefore = result.getAgentPlan(targetAgentIndex);
        expect(targetPlanBefore).toBeDefined();
        const beforeWaypointCount = targetPlanBefore!.getWaypoints().length;
        const hadEndAction = targetPlanBefore!.getWaypoints().some((waypoint) =>
            waypoint.getActions().some((action) => action.getType() === "end")
        );

        const newJobId = "job-live-new-preserve-order";
        const newJob = new Job()
            .setId(newJobId)
            .setLocation(2.295, 48.873)
            .setDuration(120);

        await editor.addNewJobs(targetAgentIndex, [newJob], { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        const jobPlan = modified.getJobPlan(newJobId);
        expect(jobPlan).toBeDefined();
        expect(jobPlan!.getAgentIndex()).toBe(targetAgentIndex);
        expect(jobPlan!.getRouteActions()[0]?.getWaypointIndex()).toBeDefined();

        const targetPlanAfter = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlanAfter).toBeDefined();
        expect(targetPlanAfter!.getWaypoints().length).toBe(beforeWaypointCount + 1);

        if (hadEndAction) {
            const endWaypointIndex = targetPlanAfter!.getWaypoints().findIndex((waypoint) =>
                waypoint.getActions().some((action) => action.getType() === "end")
            );
            expect(endWaypointIndex).toBeGreaterThanOrEqual(0);
            expect((jobPlan!.getRouteActions()[0]?.getWaypointIndex() as number)).toBeLessThan(endWaypointIndex);
        }
    });
    liveTest("addNewJobs + preserveOrder + multiple new jobs", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const targetPlanBefore = result.getAgentPlan(targetAgentIndex);
        expect(targetPlanBefore).toBeDefined();
        const beforeWaypointCount = targetPlanBefore!.getWaypoints().length;

        const firstJobId = "job-live-new-preserve-multi-1";
        const secondJobId = "job-live-new-preserve-multi-2";
        const firstJob = new Job().setId(firstJobId).setLocation(-111.832111, 40.721222).setDuration(120);
        const secondJob = new Job().setId(secondJobId).setLocation(-111.841333, 40.709444).setDuration(120);

        await editor.addNewJobs(targetAgentIndex, [firstJob, secondJob], { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        const firstPlan = modified.getJobPlan(firstJobId);
        const secondPlan = modified.getJobPlan(secondJobId);
        expect(firstPlan).toBeDefined();
        expect(secondPlan).toBeDefined();
        expect(firstPlan!.getAgentIndex()).toBe(targetAgentIndex);
        expect(secondPlan!.getAgentIndex()).toBe(targetAgentIndex);

        const targetPlanAfter = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlanAfter).toBeDefined();
        expect(targetPlanAfter!.getWaypoints().length).toBeGreaterThanOrEqual(beforeWaypointCount + 2);
    });

    liveTest("addNewJobs + reoptimize + without position", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const targetPlanBefore = result.getAgentPlan(targetAgentIndex);
        expect(targetPlanBefore).toBeDefined();
        const beforePlannedJobsCount = targetPlanBefore!.getPlannedJobs().length;

        const newJobId = "job-live-new-reoptimize";
        const newJob = new Job()
            .setId(newJobId)
            .setLocation(-111.846777, 40.734222)
            .setDuration(120);

        await editor.addNewJobs(targetAgentIndex, [newJob], { strategy: REOPTIMIZE });

        const modified = editor.getModifiedResult();
        const jobPlan = modified.getJobPlan(newJobId);
        expect(jobPlan).toBeDefined();
        expect(jobPlan!.getAgentIndex()).toBe(targetAgentIndex);

        const targetPlanAfter = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlanAfter).toBeDefined();
        expect(targetPlanAfter!.getPlannedJobs().length).toBeGreaterThanOrEqual(beforePlannedJobsCount + 1);
    });

    liveTest("addNewJobs + reoptimize + multiple new jobs", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const firstJobId = "job-live-new-reoptimize-multi-1";
        const secondJobId = "job-live-new-reoptimize-multi-2";
        const firstJob = new Job().setId(firstJobId).setLocation(-111.853111, 40.742222).setDuration(120);
        const secondJob = new Job().setId(secondJobId).setLocation(-111.821333, 40.701444).setDuration(120);

        await editor.addNewJobs(targetAgentIndex, [firstJob, secondJob], { strategy: REOPTIMIZE });

        const modified = editor.getModifiedResult();
        const firstPlan = modified.getJobPlan(firstJobId);
        const secondPlan = modified.getJobPlan(secondJobId);
        expect(firstPlan).toBeDefined();
        expect(secondPlan).toBeDefined();
        expect(firstPlan!.getAgentIndex()).toBe(targetAgentIndex);
        expect(secondPlan!.getAgentIndex()).toBe(targetAgentIndex);
    });
});
