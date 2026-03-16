import RoutePlanner, { AgentPlan, Job, PRESERVE_ORDER, REOPTIMIZE, RoutePlannerInputData, RoutePlannerResultEditor } from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { loadJson } from "../../utils.helper";
import { buildJobsResult, hasLiveApiKey, LIVE_TEST_API_KEY } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

function assertLegTimesMatchWaypoints(agentPlan: AgentPlan, maxAllowedDiffSec = 2): void {
    const waypoints = agentPlan.getWaypoints();
    const legs = agentPlan.getLegs();
    const legsByToWaypoint = new Map<number, number>(
        legs.map((leg: any) => [leg.getToWaypointIndex(), leg.getTime()])
    );

    for (let waypointIndex = 1; waypointIndex < waypoints.length; waypointIndex++) {
        const prevWaypoint = waypoints[waypointIndex - 1];
        const currWaypoint = waypoints[waypointIndex];
        const prevWaypointEndTime = prevWaypoint.getStartTime() + prevWaypoint.getDuration();

        const actions = agentPlan.getActions();
        const firstWaypointActionIndex = currWaypoint.getActions()[0].getActionIndex();

        const breakTimeBeforeFirstAction = actions[firstWaypointActionIndex - 1] && actions[firstWaypointActionIndex - 1].getType() === 'break'
            ? actions[firstWaypointActionIndex - 1].getDuration()
            : 0;

        const expectedLegTime = currWaypoint.getStartTime() - prevWaypointEndTime - breakTimeBeforeFirstAction;
        const actualLegTime = legsByToWaypoint.get(waypointIndex);

        expect(actualLegTime).toBeDefined();
        expect(Math.abs((actualLegTime as number) - expectedLegTime)).toBeLessThanOrEqual(maxAllowedDiffSec);
    }
}

function getJobsAssignmentSignature(result: any): Array<{ jobIndex: number; agentIndex: number | undefined; waypointIndex: number | undefined; }> {
    return result.getJobPlans().map((jobPlan: any) => ({
        jobIndex: jobPlan.getJobIndex(),
        agentIndex: jobPlan.getAgentIndex(),
        waypointIndex: jobPlan.getRouteActions()[0]?.getWaypointIndex()
    }));
}

function getJobWaypointIndex(result: any, jobIndexOrId: number | string): number | undefined {
    return result.getJobPlan(jobIndexOrId)?.getRouteActions()[0]?.getWaypointIndex();
}

describe("RoutePlannerResultEditor.assignJobs (live)", () => {
    liveTest("should assign a job to target agent", async () => {
        const result = await buildJobsResult();
        const editor = new RoutePlannerResultEditor(result);

        const assignedJob = result.getJobPlans().find(jobPlan => jobPlan.getAgentIndex() !== undefined);
        expect(assignedJob).toBeDefined();

        const sourceAgentIndex = assignedJob!.getAgentIndex() as number;
        const targetAgentIndex = sourceAgentIndex === 0 ? 1 : 0;

        await editor.assignJobs(targetAgentIndex, [assignedJob!.getJobIndex()]);

        const modified = editor.getModifiedResult();
        expect(modified.getJobPlan(assignedJob!.getJobIndex())?.getAgentIndex()).toBe(targetAgentIndex);
    });

    liveTest("preserveOrder + without position + no deletion - 1", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/kitchen-repair-miami__init-jobs_jobs-16_shipments-0_items-req-yes_items-tw-no_agents-5_agent-caps-yes_agent-tw-yes_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        await editor.assignJobs(4, [14], { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();

        expect(modified.getJobPlan(14)?.getAgentIndex()).toBe(4);

        const agentPlan = modified.getAgentPlan(4);
        expect(agentPlan).toBeDefined();
        expect(agentPlan!.getViolations().length).toBeGreaterThan(0);

        const waypoints = agentPlan!.getWaypoints();
        const legs = agentPlan!.getLegs();
        const legsByToWaypoint = new Map<number, number>(
            legs.map((leg) => [leg.getToWaypointIndex(), leg.getTime()])
        );

        const maxAllowedDiffSec = 2;

        for (let waypointIndex = 1; waypointIndex < waypoints.length; waypointIndex++) {
            const prevWaypoint = waypoints[waypointIndex - 1];
            const currWaypoint = waypoints[waypointIndex];
            const expectedLegTime = currWaypoint.getStartTime() - (prevWaypoint.getStartTime() + prevWaypoint.getDuration());
            const actualLegTime = legsByToWaypoint.get(waypointIndex);

            expect(actualLegTime).toBeDefined();
            expect(Math.abs((actualLegTime as number) - expectedLegTime)).toBeLessThanOrEqual(maxAllowedDiffSec);
        }
    });

    liveTest("preserveOrder + existing location", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 1;
        const referenceJobIndex = 5;
        const newJobId = "job-same-location-as-5";

        const referenceJobWaypointIndex = getJobWaypointIndex(result, referenceJobIndex);
        expect(referenceJobWaypointIndex).toBe(6);

        const targetPlanBefore = result.getAgentPlan(targetAgentIndex);
        expect(targetPlanBefore).toBeDefined();
        const waypointsBeforeCount = targetPlanBefore!.getWaypoints().length;

        const referenceJobRaw = result.getRaw().properties.params.jobs[referenceJobIndex];
        const newJob = new Job().setId(newJobId).setDuration(referenceJobRaw.duration || 0);
        if (referenceJobRaw.location) {
            newJob.setLocation(referenceJobRaw.location[0], referenceJobRaw.location[1]);
        } else if (referenceJobRaw.location_index !== undefined) {
            newJob.setLocationIndex(referenceJobRaw.location_index);
        }

        await editor.addNewJobs(targetAgentIndex, [newJob], { strategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        const targetPlanAfter = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlanAfter).toBeDefined();
        expect(targetPlanAfter!.getWaypoints().length).toBe(waypointsBeforeCount);
        expect(modified.getJobPlan(newJobId)?.getAgentIndex()).toBe(targetAgentIndex);
        expect(getJobWaypointIndex(modified, newJobId)).toBe(6);
    });

    liveTest("preserveOrder + existing location + afterwaypoint", async () => {
        const baseResult = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const targetAgentIndex = 1;
        const referenceJobIndex = 5;
        const referenceJobWaypointIndex = getJobWaypointIndex(baseResult, referenceJobIndex);
        expect(referenceJobWaypointIndex).toBe(6);
        const referenceJobRaw = baseResult.getRaw().properties.params.jobs[referenceJobIndex];

        // afterWaypoint 3 -> reuse existing waypoint #6
        const resultAfter3 = new RoutePlannerResult(
            baseResult.getCallOptions(),
            JSON.parse(JSON.stringify(baseResult.getRaw()))
        );
        const editorAfter3 = new RoutePlannerResultEditor(resultAfter3);
        const waypointsBefore3 = resultAfter3.getAgentPlan(targetAgentIndex)!.getWaypoints().length;
        const jobAfter3 = new Job().setId("job-same-location-after-3").setDuration(referenceJobRaw.duration || 0);
        if (referenceJobRaw.location) {
            jobAfter3.setLocation(referenceJobRaw.location[0], referenceJobRaw.location[1]);
        } else if (referenceJobRaw.location_index !== undefined) {
            jobAfter3.setLocationIndex(referenceJobRaw.location_index);
        }
        await editorAfter3.addNewJobs(targetAgentIndex, [jobAfter3], {
            strategy: PRESERVE_ORDER,
            afterWaypointIndex: 3
        });
        const modifiedAfter3 = editorAfter3.getModifiedResult();
        expect(modifiedAfter3.getAgentPlan(targetAgentIndex)!.getWaypoints().length).toBe(waypointsBefore3);
        expect(getJobWaypointIndex(modifiedAfter3, "job-same-location-after-3")).toBe(6);

        // afterWaypoint 7 -> create new waypoint after #6 with the same location
        const resultAfter7 = new RoutePlannerResult(
            baseResult.getCallOptions(),
            JSON.parse(JSON.stringify(baseResult.getRaw()))
        );
        const editorAfter7 = new RoutePlannerResultEditor(resultAfter7);
        const waypointsBefore7 = resultAfter7.getAgentPlan(targetAgentIndex)!.getWaypoints().length;
        const jobAfter7 = new Job().setId("job-same-location-after-7").setDuration(referenceJobRaw.duration || 0);
        if (referenceJobRaw.location) {
            jobAfter7.setLocation(referenceJobRaw.location[0], referenceJobRaw.location[1]);
        } else if (referenceJobRaw.location_index !== undefined) {
            jobAfter7.setLocationIndex(referenceJobRaw.location_index);
        }
        await editorAfter7.addNewJobs(targetAgentIndex, [jobAfter7], {
            strategy: PRESERVE_ORDER,
            afterWaypointIndex: 7
        });
        const modifiedAfter7 = editorAfter7.getModifiedResult();
        const targetPlanAfter7 = modifiedAfter7.getAgentPlan(targetAgentIndex)!;
        const newJobWaypointAfter7 = getJobWaypointIndex(modifiedAfter7, "job-same-location-after-7");
        expect(targetPlanAfter7.getWaypoints().length).toBe(waypointsBefore7 + 1);
        expect(newJobWaypointAfter7).toBeDefined();
        expect(newJobWaypointAfter7!).toBeGreaterThan(referenceJobWaypointIndex!);
        expect(targetPlanAfter7.getWaypoints()[newJobWaypointAfter7!].getOriginalLocation()).toEqual(
            targetPlanAfter7.getWaypoints()[referenceJobWaypointIndex!].getOriginalLocation()
        );
    });

    liveTest("preserveOrder + without position + deletion + deletion: preserve order", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const sourceAgentIndex = result.getJobPlan(0)?.getAgentIndex();
        expect(sourceAgentIndex).toBeDefined();
        expect(sourceAgentIndex).not.toBe(2);

        const sourceJobsBefore = result.getAgentPlan(sourceAgentIndex as number)?.getPlannedJobs() || [];
        const targetJobsBefore = result.getAgentPlan(2)?.getPlannedJobs() || [];

        await editor.assignJobs(2, [0], { strategy: PRESERVE_ORDER, removeStrategy: PRESERVE_ORDER });

        const modified = editor.getModifiedResult();
        const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex as number);
        const targetPlanAfter = modified.getAgentPlan(2);

        // added
        expect(modified.getJobPlan(0)?.getAgentIndex()).toBe(2);
        expect(targetPlanAfter).toBeDefined();
        expect(targetPlanAfter?.containsJob(0)).toBe(true);
        expect(targetPlanAfter?.getPlannedJobs().length).toBe(targetJobsBefore.length + 1);

        // removed
        if (sourcePlanAfter) {
            expect(sourcePlanAfter.containsJob(0)).toBe(false);
            expect(sourcePlanAfter.getPlannedJobs()).toEqual(sourceJobsBefore.filter((jobIndex) => jobIndex !== 0));
        } else {
            expect(sourceJobsBefore.filter((jobIndex) => jobIndex !== 0)).toEqual([]);
        }

        // legs
        assertLegTimesMatchWaypoints(targetPlanAfter!);
        if (sourcePlanAfter) {
            assertLegTimesMatchWaypoints(sourcePlanAfter);
        }

    });

    liveTest("preserveOrder + without position + deletion + reoptimize", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const sequentialEditor = new RoutePlannerResultEditor(result);

        const targetAgentIndex = 1;
        const movingJobs = [23, 24];

        const sourceByJob = new Map<number, number | undefined>();
        for (const jobIndex of movingJobs) {
            sourceByJob.set(jobIndex, result.getJobPlan(jobIndex)?.getAgentIndex());
        }

        await editor.assignJobs(targetAgentIndex, movingJobs, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();

        for (const jobIndex of movingJobs) {
            // assigned to target
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
            expect(targetPlan?.containsJob(jobIndex)).toBe(true);

            // removed from previous source (if there was one and it differs from target)
            const sourceAgentIndex = sourceByJob.get(jobIndex);
            if (sourceAgentIndex !== undefined && sourceAgentIndex !== targetAgentIndex) {
                const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
                if (sourcePlanAfter) {
                    expect(sourcePlanAfter.containsJob(jobIndex)).toBe(false);
                }
            }
        }

        const insertedWaypointIndexes = movingJobs
            .map((jobIndex) => modified.getJobPlan(jobIndex)?.getRouteActions()[0]?.getWaypointIndex())
            .filter((waypointIndex): waypointIndex is number => waypointIndex !== undefined)
            .sort((a, b) => a - b);
        expect(insertedWaypointIndexes).toEqual([7, 8]);

        // expected to produce violations in this scenario
        expect(targetPlan!.getViolations().length).toBeGreaterThan(0);

        // legs remain coherent
        assertLegTimesMatchWaypoints(targetPlan!);

        await sequentialEditor.assignJobs(targetAgentIndex, [23], {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE
        });
        await sequentialEditor.assignJobs(targetAgentIndex, [24], {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE
        });

        const sequentialResult = sequentialEditor.getModifiedResult();
        expect(getJobsAssignmentSignature(sequentialResult)).toEqual(getJobsAssignmentSignature(modified));
    });

    liveTest("preserveOrder + middle position + id + deletion + reoptimize", async () => {
        const baseResult = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const rawWithIds: any = JSON.parse(JSON.stringify(baseResult.getRaw()));
        rawWithIds.properties.params.jobs[3].id = "JOB TO TEST";
        rawWithIds.properties.params.jobs[4].id = "ANOTHER JOB TO TEXT";

        const resultByIndex = new RoutePlannerResult(
            baseResult.getCallOptions(),
            JSON.parse(JSON.stringify(rawWithIds))
        );
        const resultById = new RoutePlannerResult(
            baseResult.getCallOptions(),
            JSON.parse(JSON.stringify(rawWithIds))
        );

        const options = {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex: 7,
            append: true
        };

        const byIndexEditor = new RoutePlannerResultEditor(resultByIndex);
        await byIndexEditor.assignJobs(0, [3, 4], options);
        const byIndexModified = byIndexEditor.getModifiedResult();

        const byIdEditor = new RoutePlannerResultEditor(resultById);
        await byIdEditor.assignJobs(0, ["JOB TO TEST", "ANOTHER JOB TO TEXT"], options);
        const byIdModified = byIdEditor.getModifiedResult();

        const byIndexWaypoint3 = getJobWaypointIndex(byIndexModified, 3);
        const byIndexWaypoint4 = getJobWaypointIndex(byIndexModified, 4);
        const byIdWaypoint3 = getJobWaypointIndex(byIdModified, "JOB TO TEST");
        const byIdWaypoint4 = getJobWaypointIndex(byIdModified, "ANOTHER JOB TO TEXT");

        expect(byIndexWaypoint3).toBeDefined();
        expect(byIndexWaypoint4).toBeDefined();
        expect(byIdWaypoint3).toBeDefined();
        expect(byIdWaypoint4).toBeDefined();

        // Jobs should be after waypoint 7.
        expect(byIndexWaypoint3!).toBeGreaterThan(7);
        expect(byIndexWaypoint4!).toBeGreaterThan(7);
        expect(byIdWaypoint3!).toBeGreaterThan(7);
        expect(byIdWaypoint4!).toBeGreaterThan(7);

        // ID-based and index-based operations should produce the same result.
        expect(getJobsAssignmentSignature(byIdModified)).toEqual(getJobsAssignmentSignature(byIndexModified));
    });

    liveTest("preserveOrder + end position + exception + deletion + reoptimize", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const targetAgentPlan = result.getAgentPlan(1);
        expect(targetAgentPlan).toBeDefined();
        expect(targetAgentPlan!.getWaypoints().length).toBeGreaterThan(9);
        const hasEndActionAtWaypoint9 = targetAgentPlan!
            .getWaypoints()[9]
            .getActions()
            .some((action) => action.getType() === "end");
        expect(hasEndActionAtWaypoint9).toBe(true);

        const jobToMove = result
            .getJobPlans()
            .find((jobPlan) => jobPlan.getAgentIndex() !== 1)?.getJobIndex();
        expect(jobToMove).toBeDefined();

        await expect(
            editor.assignJobs(1, [jobToMove as number], {
                strategy: PRESERVE_ORDER,
                removeStrategy: REOPTIMIZE,
                afterWaypointIndex: 9,
                append: true
            })
        ).rejects.toThrow("Cannot change the route after waypoint 9");
    });

    liveTest("preserveOrder + midle position + append + deletion + reoptimize", async () => {
        const baseResult = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const batchResult = new RoutePlannerResult(
            baseResult.getCallOptions(),
            JSON.parse(JSON.stringify(baseResult.getRaw()))
        );
        const sequentialResult = new RoutePlannerResult(
            baseResult.getCallOptions(),
            JSON.parse(JSON.stringify(baseResult.getRaw()))
        );

        const batchEditor = new RoutePlannerResultEditor(batchResult);
        const sequentialEditor = new RoutePlannerResultEditor(sequentialResult);

        const targetAgentIndex = 0;
        const movingJobs = [3, 4];
        const options = {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex: 7,
            append: true
        };

        await batchEditor.assignJobs(targetAgentIndex, movingJobs, options);
        const batchModified = batchEditor.getModifiedResult();

        await sequentialEditor.assignJobs(targetAgentIndex, [3], options);
        await sequentialEditor.assignJobs(targetAgentIndex, [4], options);
        const sequentialModified = sequentialEditor.getModifiedResult();

        for (const jobIndex of movingJobs) {
            expect(batchModified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
            expect(sequentialModified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
        }

        const batchWaypointIndexes = movingJobs
            .map((jobIndex) => getJobWaypointIndex(batchModified, jobIndex))
            .filter((waypointIndex): waypointIndex is number => waypointIndex !== undefined)
            .sort((a, b) => a - b);
        const sequentialWaypointIndexes = movingJobs
            .map((jobIndex) => getJobWaypointIndex(sequentialModified, jobIndex))
            .filter((waypointIndex): waypointIndex is number => waypointIndex !== undefined)
            .sort((a, b) => a - b);

        expect(batchWaypointIndexes.length).toBe(2);
        expect(sequentialWaypointIndexes.length).toBe(2);
        expect(batchWaypointIndexes[0]).toBeGreaterThan(7);
        expect(batchWaypointIndexes[1]).toBeGreaterThan(7);
        expect(sequentialWaypointIndexes[0]).toBeGreaterThan(7);
        expect(sequentialWaypointIndexes[1]).toBeGreaterThan(7);

        // Insert after waypoint 7 should start from waypoint 8.
        expect(batchWaypointIndexes[0]).toBe(8);
        expect(sequentialWaypointIndexes[0]).toBe(8);

        expect(getJobsAssignmentSignature(sequentialModified)).toEqual(getJobsAssignmentSignature(batchModified));
    });

    liveTest("preserveOrder + append + deletion + reoptimize", async () => {
        const bulkyInputFile =
            "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-input.json";

        const runAppendCase = async (result: any, expectEndWaypoint: boolean) => {
            const editor = new RoutePlannerResultEditor(result);
            const targetAgentIndex = 1;
            const jobToMove = result
                .getJobPlans()
                .find((jobPlan: any) => jobPlan.getAgentIndex() !== undefined && jobPlan.getAgentIndex() !== targetAgentIndex)
                ?.getJobIndex();
            expect(jobToMove).toBeDefined();

            const sourceAgentIndex = result.getJobPlan(jobToMove as number)?.getAgentIndex();
            expect(sourceAgentIndex).toBeDefined();

            await editor.assignJobs(targetAgentIndex, [jobToMove as number], {
                strategy: PRESERVE_ORDER,
                removeStrategy: REOPTIMIZE,
                append: true
            });

            const modified = editor.getModifiedResult();
            expect(modified.getJobPlan(jobToMove as number)?.getAgentIndex()).toBe(targetAgentIndex);

            if (sourceAgentIndex !== undefined && sourceAgentIndex !== targetAgentIndex) {
                const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
                if (sourcePlanAfter) {
                    expect(sourcePlanAfter.containsJob(jobToMove as number)).toBe(false);
                }
            }

            const targetPlan = modified.getAgentPlan(targetAgentIndex);
            expect(targetPlan).toBeDefined();

            const waypoints = targetPlan!.getWaypoints();
            const endWaypointIndex = waypoints.findIndex((waypoint) =>
                waypoint.getActions().some((action) => action.getType() === "end")
            );
            const insertedJobWaypointIndex = getJobWaypointIndex(modified, jobToMove as number);
            expect(insertedJobWaypointIndex).toBeDefined();

            if (expectEndWaypoint) {
                expect(endWaypointIndex).toBeGreaterThan(0);
                expect(insertedJobWaypointIndex).toBe(endWaypointIndex - 1);
            } else {
                expect(endWaypointIndex).toBe(-1);
                expect(insertedJobWaypointIndex).toBe(waypoints.length - 1);
            }
        };

        // case 1: with end position -> append should place new waypoint before end waypoint
        const withEndResult = await buildJobsResult(bulkyInputFile);
        await runAppendCase(withEndResult, true);

        // case 2: without end position -> append should place new waypoint at route end
        const withoutEndInput = loadJson(bulkyInputFile) as RoutePlannerInputData;
        for (const agent of withoutEndInput.agents || []) {
            delete (agent as any).end_location;
            delete (agent as any).end_location_index;
        }
        const withoutEndPlanner = new RoutePlanner({ apiKey: LIVE_TEST_API_KEY }, withoutEndInput);
        const withoutEndResult = await withoutEndPlanner.plan();
        await runAppendCase(withoutEndResult, false);
    });

    liveTest("preserveOrder + assign all unassigned", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const getUnassignedJobIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getJobPlans()
                .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined)
                .map((jobPlan: any) => jobPlan.getJobIndex());

        let current = editor.getModifiedResult();
        let unassignedJobIndexes = getUnassignedJobIndexes(current);

        // Ensure we have unassigned jobs to test "assign all unassigned" deterministically.
        if (!unassignedJobIndexes.length) {
            const candidates = current
                .getJobPlans()
                .filter((jobPlan: any) => {
                    const agentIndex = jobPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((jobPlan: any) => jobPlan.getJobIndex());

            if (candidates.length) {
                await editor.removeJobs(candidates, { strategy: PRESERVE_ORDER });
                current = editor.getModifiedResult();
                unassignedJobIndexes = getUnassignedJobIndexes(current);
            }
        }

        expect(unassignedJobIndexes.length).toBeGreaterThan(0);

        await editor.assignJobs(targetAgentIndex, unassignedJobIndexes, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();
        const targetWaypoints = targetPlan!.getWaypoints();
        expect(targetWaypoints.length).toBeGreaterThan(0);
        const lastWaypointActions = targetWaypoints[targetWaypoints.length - 1].getActions();
        expect(lastWaypointActions.some((action) => action.getType() === "end")).toBe(true);

        for (const jobIndex of unassignedJobIndexes) {
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
        }

        const remainingUnassigned = modified
            .getJobPlans()
            .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined);
        expect(remainingUnassigned.length).toBe(0);

        expect(targetPlan!.getViolations().length).toBeGreaterThan(0);
    });  

    liveTest("preserveOrder + assign all unassigned + position", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;
        const afterWaypointIndex = 3;

        const getUnassignedJobIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getJobPlans()
                .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined)
                .map((jobPlan: any) => jobPlan.getJobIndex());

        let current = editor.getModifiedResult();
        let unassignedJobIndexes = getUnassignedJobIndexes(current);

        if (!unassignedJobIndexes.length) {
            const candidates = current
                .getJobPlans()
                .filter((jobPlan: any) => {
                    const agentIndex = jobPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((jobPlan: any) => jobPlan.getJobIndex());

            if (candidates.length) {
                await editor.removeJobs(candidates, { strategy: PRESERVE_ORDER });
                current = editor.getModifiedResult();
                unassignedJobIndexes = getUnassignedJobIndexes(current);
            }
        }

        expect(unassignedJobIndexes.length).toBeGreaterThan(0);

        await editor.assignJobs(targetAgentIndex, unassignedJobIndexes, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex
        });

        const modified = editor.getModifiedResult();

        for (const jobIndex of unassignedJobIndexes) {
            const waypointIndex = getJobWaypointIndex(modified, jobIndex);
            expect(waypointIndex).toBeDefined();
            expect(waypointIndex!).toBeGreaterThan(afterWaypointIndex);
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
        }
    });
    
    liveTest("preserveOrder + assign all unassigned + position + append", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;
        const afterWaypointIndex = 3;

        const getUnassignedJobIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getJobPlans()
                .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined)
                .map((jobPlan: any) => jobPlan.getJobIndex());

        let current = editor.getModifiedResult();
        let unassignedJobIndexes = getUnassignedJobIndexes(current);

        if (!unassignedJobIndexes.length) {
            const candidates = current
                .getJobPlans()
                .filter((jobPlan: any) => {
                    const agentIndex = jobPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((jobPlan: any) => jobPlan.getJobIndex());

            if (candidates.length) {
                await editor.removeJobs(candidates, { strategy: PRESERVE_ORDER });
                current = editor.getModifiedResult();
                unassignedJobIndexes = getUnassignedJobIndexes(current);
            }
        }

        expect(unassignedJobIndexes.length).toBeGreaterThan(0);

        await editor.assignJobs(targetAgentIndex, unassignedJobIndexes, {
            strategy: PRESERVE_ORDER,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex,
            append: true
        });

        const modified = editor.getModifiedResult();
        const insertedWaypointIndexes: number[] = [];

        for (const jobIndex of unassignedJobIndexes) {
            const waypointIndex = getJobWaypointIndex(modified, jobIndex);
            expect(waypointIndex).toBeDefined();
            expect(waypointIndex!).toBeGreaterThan(afterWaypointIndex);
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
            insertedWaypointIndexes.push(waypointIndex as number);
        }

        // With append=true and explicit position, first inserted job should be right after the anchor waypoint.
        expect(Math.min(...insertedWaypointIndexes)).toBe(afterWaypointIndex + 1);
    });  

    liveTest("reoptimize + without position + deletion + reoptimize", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 1;

        const movingJobs = result
            .getJobPlans()
            .filter((jobPlan) => {
                const agentIndex = jobPlan.getAgentIndex();
                return agentIndex !== undefined && agentIndex !== targetAgentIndex;
            })
            .slice(0, 2)
            .map((jobPlan) => jobPlan.getJobIndex());   

        expect(movingJobs.length).toBe(2);
        
        const sourceByJob = new Map<number, number | undefined>(
            movingJobs.map((jobIndex) => [jobIndex, result.getJobPlan(jobIndex)?.getAgentIndex()])
        );
        const targetJobsBefore = result.getAgentPlan(targetAgentIndex)?.getPlannedJobs().length ?? 0;

        await editor.assignJobs(targetAgentIndex, movingJobs, {
            strategy: REOPTIMIZE,
            removeStrategy: REOPTIMIZE
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();
        expect(targetPlan!.getPlannedJobs().length).toBe(targetJobsBefore + movingJobs.length);

        for (const jobIndex of movingJobs) {
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
            expect(targetPlan?.containsJob(jobIndex)).toBe(true);

            const sourceAgentIndex = sourceByJob.get(jobIndex);
            if (sourceAgentIndex !== undefined && sourceAgentIndex !== targetAgentIndex) {
                const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);
                if (sourcePlanAfter) {
                    expect(sourcePlanAfter.containsJob(jobIndex)).toBe(false);
                }
            }
        }

        assertLegTimesMatchWaypoints(targetPlan!);
        for (const sourceAgentIndex of new Set(sourceByJob.values())) {
            if (sourceAgentIndex !== undefined && sourceAgentIndex !== targetAgentIndex) {
                const sourcePlanAfter = modified.getAgentPlan(sourceAgentIndex);

                if (sourcePlanAfter) {
                    assertLegTimesMatchWaypoints(sourcePlanAfter);
                }
            }
        }
    });

    liveTest("reoptimize + end position + exception + deletion + reoptimize", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const targetAgentPlan = result.getAgentPlan(1);
        expect(targetAgentPlan).toBeDefined();
        expect(targetAgentPlan!.getWaypoints().length).toBeGreaterThan(9);
        const hasEndActionAtWaypoint9 = targetAgentPlan!
            .getWaypoints()[9]
            .getActions()
            .some((action) => action.getType() === "end");
        expect(hasEndActionAtWaypoint9).toBe(true);

        const jobToAssign = result
            .getJobPlans()
            .find((jobPlan) => jobPlan.getAgentIndex() !== 1)?.getJobIndex();
        expect(jobToAssign).toBeDefined();

        await expect(
            editor.assignJobs(1, [jobToAssign as number], {
                strategy: REOPTIMIZE,
                removeStrategy: REOPTIMIZE,
                afterWaypointIndex: 9,
                append: true
            })
        ).rejects.toThrow("Cannot change the route after waypoint 9");
    });

    liveTest("reoptimize + midle position + deletion + reoptimize", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;
        const afterWaypointIndex = 7;

        const jobToMove = result
            .getJobPlans()
            .find((jobPlan) => {
                const agentIndex = jobPlan.getAgentIndex();
                return agentIndex !== undefined && agentIndex !== targetAgentIndex;
            })
            ?.getJobIndex();
        expect(jobToMove).toBeDefined();

        await editor.assignJobs(targetAgentIndex, [jobToMove as number], {
            strategy: REOPTIMIZE,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex
        });

        const modified = editor.getModifiedResult();
        const waypointIndex = getJobWaypointIndex(modified, jobToMove as number);

        expect(modified.getJobPlan(jobToMove as number)?.getAgentIndex()).toBe(targetAgentIndex);
        expect(waypointIndex).toBeDefined();
        expect(waypointIndex!).toBeGreaterThan(afterWaypointIndex);
    });
  

    liveTest("reoptimize + assign all unassigned", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;

        const getUnassignedJobIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getJobPlans()
                .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined)
                .map((jobPlan: any) => jobPlan.getJobIndex());

        let current = editor.getModifiedResult();
        let unassignedJobIndexes = getUnassignedJobIndexes(current);

        if (!unassignedJobIndexes.length) {
            const candidates = current
                .getJobPlans()
                .filter((jobPlan: any) => {
                    const agentIndex = jobPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((jobPlan: any) => jobPlan.getJobIndex());

            if (candidates.length) {
                await editor.removeJobs(candidates, { strategy: REOPTIMIZE });
                current = editor.getModifiedResult();
                unassignedJobIndexes = getUnassignedJobIndexes(current);
            }
        }

        expect(unassignedJobIndexes.length).toBeGreaterThan(0);

        await editor.assignJobs(targetAgentIndex, unassignedJobIndexes, {
            strategy: REOPTIMIZE,
            removeStrategy: REOPTIMIZE
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();

        for (const jobIndex of unassignedJobIndexes) {
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
        }

        const remainingUnassigned = modified
            .getJobPlans()
            .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined);
        expect(remainingUnassigned.length).toBe(0);

        assertLegTimesMatchWaypoints(targetPlan!);
    });  

    liveTest("reoptimize + assign all unassigned + position", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);
        const targetAgentIndex = 0;
        const afterWaypointIndex = 3;

        const getUnassignedJobIndexes = (plannerResult: any): number[] =>
            plannerResult
                .getJobPlans()
                .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined)
                .map((jobPlan: any) => jobPlan.getJobIndex());

        let current = editor.getModifiedResult();
        let unassignedJobIndexes = getUnassignedJobIndexes(current);

        if (!unassignedJobIndexes.length) {
            const candidates = current
                .getJobPlans()
                .filter((jobPlan: any) => {
                    const agentIndex = jobPlan.getAgentIndex();
                    return agentIndex !== undefined && agentIndex !== targetAgentIndex;
                })
                .slice(0, 2)
                .map((jobPlan: any) => jobPlan.getJobIndex());

            if (candidates.length) {
                await editor.removeJobs(candidates, { strategy: REOPTIMIZE });
                current = editor.getModifiedResult();
                unassignedJobIndexes = getUnassignedJobIndexes(current);
            }
        }

        expect(unassignedJobIndexes.length).toBeGreaterThan(0);

        await editor.assignJobs(targetAgentIndex, unassignedJobIndexes, {
            strategy: REOPTIMIZE,
            removeStrategy: REOPTIMIZE,
            afterWaypointIndex
        });

        const modified = editor.getModifiedResult();
        const targetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(targetPlan).toBeDefined();

        for (const jobIndex of unassignedJobIndexes) {
            const waypointIndex = getJobWaypointIndex(modified, jobIndex);
            expect(waypointIndex).toBeDefined();
            expect(waypointIndex!).toBeGreaterThan(afterWaypointIndex);
            expect(modified.getJobPlan(jobIndex)?.getAgentIndex()).toBe(targetAgentIndex);
        }

        const remainingUnassigned = modified
            .getJobPlans()
            .filter((jobPlan: any) => jobPlan.getAgentIndex() === undefined);
        expect(remainingUnassigned.length).toBe(0);

        assertLegTimesMatchWaypoints(targetPlan!);
    });

    liveTest("preserveOrder + add job to exiting location", async () => {
    });
});
