import { PRESERVE_ORDER, REOPTIMIZE, RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.removeJobs (live)", () => {
    liveTest("removeJobs + preserveOrder + single", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedJob = result.getJobPlans().find((jobPlan) => jobPlan.getAgentIndex() !== undefined);
        expect(assignedJob).toBeDefined();

        const sourceAgentIndex = assignedJob!.getAgentIndex() as number;
        const sourcePlanBefore = result.getAgentPlan(sourceAgentIndex);
        expect(sourcePlanBefore).toBeDefined();
        const sourceCountBefore = sourcePlanBefore!.getPlannedJobs().length;

        await editor.removeJobs([assignedJob!.getJobIndex()], { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        expect(modified.getJobPlan(assignedJob!.getJobIndex())?.getAgentIndex()).toBeUndefined();

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedJobs().length).toBe(sourceCountBefore - 1);
            expect(sourcePlanAfter.containsJob(assignedJob!.getJobIndex())).toBe(false);
        }

        expect(modified.getRaw().properties.issues?.unassigned_jobs || []).toContain(assignedJob!.getJobIndex());
    });

    liveTest("removeJobs + preserveOrder + multiple", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const sourcePlan = result
            .getAgentPlans()
            .find((agentPlan) => !!agentPlan && agentPlan.getPlannedJobs().length >= 2);
        expect(sourcePlan).toBeDefined();

        const sourceAgentIndex = sourcePlan!.getAgentIndex();
        const jobsToRemove = sourcePlan!.getPlannedJobs().slice(0, 2);
        const sourceCountBefore = sourcePlan!.getPlannedJobs().length;

        await editor.removeJobs(jobsToRemove, { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        for (const jobIndex of jobsToRemove) {
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBeUndefined();
            expect(modified.getRaw().properties.issues?.unassigned_jobs || []).toContain(jobIndex);
        }

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedJobs().length).toBe(sourceCountBefore - jobsToRemove.length);
            for (const jobIndex of jobsToRemove) {
                expect(sourcePlanAfter.containsJob(jobIndex)).toBe(false);
            }
        }
    });

    liveTest("removeJobs + reoptimize + single", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedJob = result.getJobPlans().find((jobPlan) => jobPlan.getAgentIndex() !== undefined);
        expect(assignedJob).toBeDefined();

        const sourceAgentIndex = assignedJob!.getAgentIndex() as number;
        const sourcePlanBefore = result.getAgentPlan(sourceAgentIndex);
        expect(sourcePlanBefore).toBeDefined();
        const sourceCountBefore = sourcePlanBefore!.getPlannedJobs().length;

        await editor.removeJobs([assignedJob!.getJobIndex()], { strategy: REOPTIMIZE });

        const modified = editor.getModifiedResult();
        expect(modified.getJobPlan(assignedJob!.getJobIndex())?.getAgentIndex()).toBeUndefined();

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedJobs().length).toBe(sourceCountBefore - 1);
            expect(sourcePlanAfter.containsJob(assignedJob!.getJobIndex())).toBe(false);
        }
    });

    liveTest("removeJobs + reoptimize + multiple", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const sourcePlan = result
            .getAgentPlans()
            .find((agentPlan) => !!agentPlan && agentPlan.getPlannedJobs().length >= 2);
        expect(sourcePlan).toBeDefined();

        const sourceAgentIndex = sourcePlan!.getAgentIndex();
        const jobsToRemove = sourcePlan!.getPlannedJobs().slice(0, 2);
        const sourceCountBefore = sourcePlan!.getPlannedJobs().length;

        await editor.removeJobs(jobsToRemove, { strategy: REOPTIMIZE });

        const modified = editor.getModifiedResult();
        for (const jobIndex of jobsToRemove) {
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBeUndefined();
        }

        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.getPlannedJobs().length).toBe(sourceCountBefore - jobsToRemove.length);
            for (const jobIndex of jobsToRemove) {
                expect(sourcePlanAfter.containsJob(jobIndex)).toBe(false);
            }
        }
    });
});
