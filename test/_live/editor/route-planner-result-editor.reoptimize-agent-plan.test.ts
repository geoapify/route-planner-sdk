import { Job, PRESERVE_ORDER, RoutePlannerResultEditor } from "../../../src";
import { buildJobsResult, buildShipmentsResult, hasLiveApiKey } from "./editor-live.helper";

jest.setTimeout(120000);

const liveTest = hasLiveApiKey ? test : test.skip;

describe("RoutePlannerResultEditor.reoptimizeAgentPlan (live)", () => {
    liveTest("reoptimizeAgentPlan + includeUnassigned=false + allowViolations=false", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const targetAgentPlan = result.getAgentPlans().find((agentPlan) => !!agentPlan && agentPlan.getPlannedJobs().length > 0);
        expect(targetAgentPlan).toBeDefined();
        const targetAgentIndex = targetAgentPlan!.getAgentIndex();

        const firstPlannedJobIndex = targetAgentPlan!.getPlannedJobs()[0];
        const firstPlannedJobInput = result.getRaw().properties.params.jobs[firstPlannedJobIndex];
        const baseLocation = firstPlannedJobInput.location as [number, number];
        expect(baseLocation).toBeDefined();

        const highPriorityJob1Id = "hp-job-reoptimize-1";
        const highPriorityJob2Id = "hp-job-reoptimize-2";
        const lowPriorityJob1Id = "lp-job-reoptimize-1";
        const lowPriorityJob2Id = "lp-job-reoptimize-2";

        const newJobs = [
            new Job().setId(highPriorityJob1Id).setLocation(baseLocation[0], baseLocation[1]).setDuration(60).setPriority(100),
            new Job().setId(highPriorityJob2Id).setLocation(baseLocation[0], baseLocation[1]).setDuration(60).setPriority(100),
            new Job().setId(lowPriorityJob1Id).setLocation(baseLocation[0], baseLocation[1]).setDuration(60).setPriority(1),
            new Job().setId(lowPriorityJob2Id).setLocation(baseLocation[0], baseLocation[1]).setDuration(60).setPriority(1)
        ];

        await editor.addNewJobs(targetAgentIndex, newJobs, { strategy: PRESERVE_ORDER, append: true });

        const afterAdd = editor.getModifiedResult();
        expect(afterAdd.getJobPlan(highPriorityJob1Id)?.getAgentIndex()).toBe(targetAgentIndex);
        expect(afterAdd.getJobPlan(highPriorityJob2Id)?.getAgentIndex()).toBe(targetAgentIndex);

        const success = await editor.reoptimizeAgentPlan(targetAgentIndex, {
            includeUnassigned: false,
            allowViolations: false
        });
        expect(success).toBe(true);

        const modified = editor.getModifiedResult();
        const reoptimizedTargetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(reoptimizedTargetPlan).toBeDefined();
        expect(reoptimizedTargetPlan!.getViolations().length).toBe(0);

        expect(modified.getJobPlan(highPriorityJob1Id)?.getAgentIndex()).toBe(targetAgentIndex);
        expect(modified.getJobPlan(highPriorityJob2Id)?.getAgentIndex()).toBe(targetAgentIndex);
    });

    liveTest("reoptimizeAgentPlan + includeUnassigned=true + allowViolations=false", async () => {
        const result = await buildShipmentsResult(
            "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json"
        );

        const targetRaw = result.getRaw();
        const unassignedShipmentIndex = targetRaw.properties.issues?.unassigned_shipments?.[0];
        expect(typeof unassignedShipmentIndex).toBe("number");
        // Boost one currently unassigned shipment to make it preferable during reoptimize.
        targetRaw.properties.params.shipments[unassignedShipmentIndex as number].priority = 99;

        const editor = new RoutePlannerResultEditor(result);

        const targetAgentPlan = result.getAgentPlans().find((agentPlan) => !!agentPlan);
        expect(targetAgentPlan).toBeDefined();
        const targetAgentIndex = targetAgentPlan!.getAgentIndex();

        const unassignedShipmentsBefore = result.getUnassignedShipments();
        expect(unassignedShipmentsBefore.length).toBeGreaterThan(0);

        const success = await editor.reoptimizeAgentPlan(targetAgentIndex, {
            includeUnassigned: true,
            allowViolations: false
        });
        expect(success).toBe(true);

        const modified = editor.getModifiedResult();
        const reoptimizedTargetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(reoptimizedTargetPlan).toBeDefined();
        expect(reoptimizedTargetPlan!.getViolations().length).toBe(0);
        expect(reoptimizedTargetPlan!.containsShipment(unassignedShipmentIndex as number)).toBe(true);
    });

    liveTest("reoptimizeAgentPlan + includeUnassigned=false + allowViolations=true", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const raw = result.getRaw();
        const inputJobs = raw.properties.params.jobs;
        const inputAgents = raw.properties.params.agents;

        const candidatePlans = result.getAgentPlans()
            .filter((agentPlan): agentPlan is NonNullable<typeof agentPlan> => !!agentPlan)
            .filter((agentPlan) => {
                const capacity = inputAgents[agentPlan.getAgentIndex()]?.pickup_capacity;
                return (
                    agentPlan.getPlannedJobs().length > 0 &&
                    typeof capacity === "number" &&
                    Number.isFinite(capacity) &&
                    capacity > 0
                );
            });

        expect(candidatePlans.length).toBeGreaterThan(0);

        const getPickupLoadRatio = (agentPlan: any): number => {
            const agentIndex = agentPlan.getAgentIndex();
            const capacity = inputAgents[agentIndex].pickup_capacity as number;
            const pickupTotal = agentPlan.getPlannedJobs().reduce((sum: number, jobIndex: number) => {
                const pickupAmount = inputJobs[jobIndex]?.pickup_amount;
                return sum + (typeof pickupAmount === "number" && Number.isFinite(pickupAmount) ? pickupAmount : 0);
            }, 0);
            return pickupTotal / capacity;
        };

        const targetAgentPlan = candidatePlans.sort((a, b) => getPickupLoadRatio(b) - getPickupLoadRatio(a))[0];
        expect(targetAgentPlan).toBeDefined();
        const targetAgentIndex = targetAgentPlan!.getAgentIndex();
        const initiallyPlannedJobs = [...targetAgentPlan!.getPlannedJobs()];
        expect(initiallyPlannedJobs.length).toBeGreaterThan(0);
        const targetAgentPickupCapacity = inputAgents[targetAgentIndex].pickup_capacity as number;
        const targetAgentCurrentPickup = initiallyPlannedJobs.reduce((sum, jobIndex) => {
            const pickupAmount = inputJobs[jobIndex]?.pickup_amount;
            return sum + (typeof pickupAmount === "number" && Number.isFinite(pickupAmount) ? pickupAmount : 0);
        }, 0);
        const overflowPickupAmount = Math.max(1, targetAgentPickupCapacity - targetAgentCurrentPickup + 1);
        const firstPlannedJobLocation = inputJobs[initiallyPlannedJobs[0]].location as [number, number];
        expect(firstPlannedJobLocation).toBeDefined();

        const forcedJobId = "job-reoptimize-allow-violations";
        const forcedJob = new Job()
            .setId(forcedJobId)
            .setLocation(firstPlannedJobLocation[0], firstPlannedJobLocation[1])
            .setDuration(3600)
            .setPickupAmount(overflowPickupAmount);

        await editor.addNewJobs(targetAgentIndex, [forcedJob], { strategy: PRESERVE_ORDER, append: true });
        const planAfterAdd = editor.getModifiedResult().getAgentPlan(targetAgentIndex);
        expect(planAfterAdd).toBeDefined();
        const oldPlanTime = planAfterAdd!.getTime();

        const success = await editor.reoptimizeAgentPlan(targetAgentIndex, {
            includeUnassigned: false,
            allowViolations: true
        });
        expect(success).toBe(true);

        const modified = editor.getModifiedResult();
        const reoptimizedTargetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(reoptimizedTargetPlan).toBeDefined();
        expect(reoptimizedTargetPlan!.containsJob(forcedJobId)).toBe(true);
        for (const initialJobIndex of initiallyPlannedJobs) {
            expect(reoptimizedTargetPlan!.containsJob(initialJobIndex)).toBe(true);
        }
        expect(reoptimizedTargetPlan!.getViolations().length).toBeGreaterThan(0);
        expect(
            reoptimizedTargetPlan!.getViolations().some((violation) => violation.name === "AgentPickupCapacityExceeded")
        ).toBe(true);
        expect(reoptimizedTargetPlan!.getTime()).toBeLessThan(oldPlanTime);
    });
    liveTest("reoptimizeAgentPlan + no current agent plan", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const unassignedAgentIndexes = result.getRaw().properties.issues?.unassigned_agents || [];
        expect(unassignedAgentIndexes.length).toBeGreaterThan(0);
        const targetAgentIndex = unassignedAgentIndexes[0];

        const before = editor.getModifiedResult();
        const beforeRaw = before.getRaw();
        const beforeFeatureCount = beforeRaw.features.length;
        const beforeUnassignedJobs = [...(beforeRaw.properties.issues?.unassigned_jobs || [])];
        const beforeUnassignedShipments = [...(beforeRaw.properties.issues?.unassigned_shipments || [])];

        const success = await editor.reoptimizeAgentPlan(targetAgentIndex, {
            includeUnassigned: false,
            allowViolations: false
        });

        expect(success).toBe(true);

        const modified = editor.getModifiedResult();
        expect(modified.getAgentPlan(targetAgentIndex)).toBeUndefined();
        expect(modified.getRaw().features.length).toBe(beforeFeatureCount);
        expect(modified.getRaw().properties.issues?.unassigned_jobs || []).toEqual(beforeUnassignedJobs);
        expect(modified.getRaw().properties.issues?.unassigned_shipments || []).toEqual(beforeUnassignedShipments);
    });
    liveTest("reoptimizeAgentPlan + existing violations + allowViolations=true", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const raw = result.getRaw();
        const inputJobs = raw.properties.params.jobs;
        const inputAgents = raw.properties.params.agents;

        const candidatePlans = result.getAgentPlans()
            .filter((agentPlan): agentPlan is NonNullable<typeof agentPlan> => !!agentPlan)
            .filter((agentPlan) => {
                const capacity = inputAgents[agentPlan.getAgentIndex()]?.pickup_capacity;
                return (
                    agentPlan.getPlannedJobs().length > 0 &&
                    typeof capacity === "number" &&
                    Number.isFinite(capacity) &&
                    capacity > 0
                );
            });
        expect(candidatePlans.length).toBeGreaterThan(0);

        const targetAgentPlan = candidatePlans[0];
        const targetAgentIndex = targetAgentPlan.getAgentIndex();
        const plannedJobs = targetAgentPlan.getPlannedJobs();
        expect(plannedJobs.length).toBeGreaterThan(0);

        const pickupCapacity = inputAgents[targetAgentIndex].pickup_capacity as number;
        const currentPickup = plannedJobs.reduce((sum, jobIndex) => {
            const pickupAmount = inputJobs[jobIndex]?.pickup_amount;
            return sum + (typeof pickupAmount === "number" && Number.isFinite(pickupAmount) ? pickupAmount : 0);
        }, 0);
        const overflowPickupAmount = Math.max(1, pickupCapacity - currentPickup + 1);
        const baseLocation = inputJobs[plannedJobs[0]].location as [number, number];
        expect(baseLocation).toBeDefined();

        const violatingJobId = "job-existing-violations-reoptimize";
        const violatingJob = new Job()
            .setId(violatingJobId)
            .setLocation(baseLocation[0], baseLocation[1])
            .setDuration(1800)
            .setPickupAmount(overflowPickupAmount);

        await editor.addNewJobs(targetAgentIndex, [violatingJob], { strategy: PRESERVE_ORDER, append: true });

        const beforeReoptimize = editor.getModifiedResult().getAgentPlan(targetAgentIndex);
        expect(beforeReoptimize).toBeDefined();
        expect(beforeReoptimize!.containsJob(violatingJobId)).toBe(true);
        expect(beforeReoptimize!.getViolations().length).toBeGreaterThan(0);
        expect(beforeReoptimize!.getViolations().some((v) => v.name === "AgentPickupCapacityExceeded")).toBe(true);

        const success = await editor.reoptimizeAgentPlan(targetAgentIndex, {
            includeUnassigned: false,
            allowViolations: true
        });
        expect(success).toBe(true);

        const afterReoptimize = editor.getModifiedResult().getAgentPlan(targetAgentIndex);
        expect(afterReoptimize).toBeDefined();
        expect(afterReoptimize!.containsJob(violatingJobId)).toBe(true);
        expect(afterReoptimize!.getViolations().length).toBeGreaterThan(0);
        expect(afterReoptimize!.getViolations().every((v) => v.agentIndex === targetAgentIndex)).toBe(true);
    });
    liveTest("reoptimizeAgentPlan + existing violations + allowViolations=false", async () => {
        const result = await buildJobsResult(
            "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-input.json"
        );
        const editor = new RoutePlannerResultEditor(result);

        const raw = result.getRaw();
        const inputJobs = raw.properties.params.jobs;
        const inputAgents = raw.properties.params.agents;

        const targetAgentPlan = result.getAgentPlans()
            .filter((agentPlan): agentPlan is NonNullable<typeof agentPlan> => !!agentPlan)
            .find((agentPlan) => {
                const pickupCapacity = inputAgents[agentPlan.getAgentIndex()]?.pickup_capacity;
                return (
                    agentPlan.getPlannedJobs().length > 0 &&
                    typeof pickupCapacity === "number" &&
                    Number.isFinite(pickupCapacity) &&
                    pickupCapacity > 0
                );
            });
        expect(targetAgentPlan).toBeDefined();

        const targetAgentIndex = targetAgentPlan!.getAgentIndex();
        const firstPlannedJobIndex = targetAgentPlan!.getPlannedJobs()[0];
        const firstPlannedJobLocation = inputJobs[firstPlannedJobIndex].location as [number, number];
        expect(firstPlannedJobLocation).toBeDefined();

        const pickupCapacity = inputAgents[targetAgentIndex].pickup_capacity as number;
        const violatingJobId = "job-existing-violations-strict-reoptimize";
        const violatingJob = new Job()
            .setId(violatingJobId)
            .setLocation(firstPlannedJobLocation[0], firstPlannedJobLocation[1])
            .setDuration(1800)
            // Impossible to assign under strict capacity even alone
            .setPickupAmount(pickupCapacity + 1);

        await editor.addNewJobs(targetAgentIndex, [violatingJob], { strategy: PRESERVE_ORDER, append: true });

        const beforeReoptimize = editor.getModifiedResult().getAgentPlan(targetAgentIndex);
        expect(beforeReoptimize).toBeDefined();
        expect(beforeReoptimize!.containsJob(violatingJobId)).toBe(true);
        expect(beforeReoptimize!.getViolations().length).toBeGreaterThan(0);
        expect(beforeReoptimize!.getViolations().some((v) => v.name === "AgentPickupCapacityExceeded")).toBe(true);

        const success = await editor.reoptimizeAgentPlan(targetAgentIndex, {
            includeUnassigned: false,
            allowViolations: false
        });
        expect(success).toBe(true);

        const modified = editor.getModifiedResult();
        const reoptimizedTargetPlan = modified.getAgentPlan(targetAgentIndex);
        expect(reoptimizedTargetPlan).toBeDefined();
        expect(reoptimizedTargetPlan!.getViolations().length).toBe(0);

        // Strict reoptimize should drop impossible job from this agent plan.
        expect(reoptimizedTargetPlan!.containsJob(violatingJobId)).toBe(false);
        expect(modified.getJobPlan(violatingJobId)?.getAgentIndex()).toBeUndefined();
    });
});
