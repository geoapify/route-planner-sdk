import RoutePlanner, {
    RoutePlannerResultEditor,
    RoutePlannerResultData, Agent, Job, RoutePlannerResultResponseData
} from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { loadJson } from "../../utils.helper";
import TEST_API_KEY from "../../../env-variables";
import {RoutePlannerResultReverseConverter} from "../../route-planner-result-reverse-converter";

const API_KEY = TEST_API_KEY;

describe('RoutePlannerResultJobEditor', () => {

    test('assignJobs should work as expected for simple case"', async () => {
        const planner = new RoutePlanner({apiKey: API_KEY});

        planner.setMode("drive");

        planner.addAgent(new Agent()
            .setStartLocation(44.45876306369348,40.22179735)
            .setPickupCapacity(20)
            .setId("agent-A"));

        planner.addAgent(new Agent()
            .setStartLocation(44.400450399509495,40.153735600000005)
            .setPickupCapacity(20)
            .setId("agent-B"));

        planner.addJob(new Job()
            .setLocation(44.50932929564537, 40.18686625)
            .setPickupAmount(10)
            .setId("job-1"));
        planner.addJob(new Job()
            .setLocation(44.511160727462574, 40.1816037)
            .setPickupAmount(10)
            .setPriority(10)
            .setId("job-2"));

        planner.addJob(new Job()
            .setLocation(44.517954005538606, 40.18518455)
            .setPickupAmount(10)
            .setPriority(10)
            .setId("job-3"));
        planner.addJob(new Job()
            .setLocation(44.5095432, 40.18665755000001)
            .setPickupAmount(10)
            .setPriority(10)
            .setId("job-4"));

        const result = await planner.plan();
        expect(result).toBeDefined();
        expect(result.getAgentSolutions().length).toBe(2);
        expect(result.getData().inputData).toBeDefined();

        const routeEditor = new RoutePlannerResultEditor(result);
        let modifiedResult = routeEditor.getModifiedResult();
        modifiedResult.getData().inputData.agents.forEach(agent => {
            agent.pickup_capacity = 100;
        })
        let agentToAssignTheJob = result.getJobInfo('job-2')!.getAgentId() == 'agent-B' ? 'agent-A' : 'agent-B';
        await routeEditor.assignJobs(agentToAssignTheJob, ['job-2']);
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe(agentToAssignTheJob);
    });

    test('assignJobs should work "AgentSolution for provided agentId is found and the job is assigned to someone else."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
        // Initially we have
        // Job 1 -> Agent B, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> Agent B
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignJobs('agent-B', ['job-2']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After assignment we should have
        // Job 1 -> Agent B, Job 2 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')!.getAgentId()).toBe('agent-B');
    });

    test('assignJobs should change priority if its passed', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignJobs('agent-B', ['job-2'], 100);
        let modifiedResult = routeEditor.getModifiedResult();

        expect(modifiedResult.getRawData().properties.params.jobs[0].priority).toBeUndefined();
        expect(modifiedResult.getRawData().properties.params.jobs[1].priority).toBe(100);
        expect(modifiedResult.getRawData().properties.params.jobs[2].priority).toBe(10);
        expect(modifiedResult.getRawData().properties.params.jobs[3].priority).toBe(10);
    });

    test('assignJobs should work "AgentSolution for provided agentId is found. But the job is not assigned to anyone."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        // Initially we have
        // Job 1 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        // Job 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignJobs('agent-B', ['job-2']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After assignment we should have
        // Job 1 -> Agent B, Job 2 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getUnassignedJobs().length).toBe(0);
    });

    test('assignJobs should work "AgentSolution for provided agentId is not found and the job is assigned to someone."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-assigned.json");
        // Initially we have
        // Job 1 -> unassigned, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignJobs('agent-B', ['job-2']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After assignment we should have
        // Job 1 -> unassigned, Job 2 -> Agent B
        // Job 3 -> Agent A, Job 4 -> unassigned
        expect(modifiedResult.getJobInfo('job-1')).toBeUndefined();
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')).toBeUndefined();
        expect(modifiedResult.getUnassignedAgents().length).toBe(0);
        expect(modifiedResult.getUnassignedJobs().length).toBe(2);
        expect(modifiedResult.getUnassignedJobs()[0]).toEqual(modifiedResult.getRawData().properties.params.jobs[0]);
        expect(modifiedResult.getUnassignedJobs()[1]).toEqual(modifiedResult.getRawData().properties.params.jobs[3]);
    });

    test('assignJobs should work "AgentSolution for provided agentId is not found and the job is not assigned to anyone."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
        // Initially we have
        // Job 1 -> unassigned, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignJobs('agent-B', ['job-1']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After assignment we should have
        // Job 1 -> Agent B, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')).toBeUndefined();
        expect(modifiedResult.getUnassignedAgents().length).toBe(0);
        expect(modifiedResult.getUnassignedJobs().length).toBe(1);
        expect(modifiedResult.getUnassignedJobs()[0]).toEqual(modifiedResult.getRawData().properties.params.jobs[3]);
    });

    test('assignJobs should work "Job with provided jobId already assigned to provided agentId."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
        // Initially we have
        // Job 1 -> Agent B, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> Agent B
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.assignJobs('agent-A', ['job-2']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Job with index 1 already assigned to agent with index 0');
        }
    });

    test('assignJobs should work "Job with provided jobId not found."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
        // Initially we have
        // Job 1 -> Agent B, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> Agent B
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);

        try {
            await routeEditor.assignJobs('agent-A', ['job-5']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Job with id 4 is invalid');
        }
    });

    test('assignJobs should work "Job with provided jobId not found."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
        // Initially we have
        // Job 1 -> Agent B, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> Agent B
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);

        try {
            await routeEditor.assignJobs('agent-B', ['job-5']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Job with id 4 is invalid');
        }
    });

    test('assignJobs should assign to Agent B when AgentSolution is found and job is unassigned', async () => {
        const assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        let plannerResult = new RoutePlannerResult({ apiKey: API_KEY }, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.assignJobs('agent-B', ['job-2']);

        const modifiedResult = routeEditor.getModifiedResult();
        expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')!.getAgentId()).toBe('agent-B');
    });

    test('assignJobs should throw error when job is already assigned to a different agent', async () => {
        const assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
        let plannerResult = new RoutePlannerResult({ apiKey: API_KEY }, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.assignJobs('agent-A', ['job-2']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Job with index 1 already assigned to agent with index 0');
        }
    });

    test('assignJobs should throw error when Agent with givenId is not found', async () => {
        const assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
        let plannerResult = new RoutePlannerResult({ apiKey: API_KEY }, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.assignJobs('agent-unknown', ['job-2']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Agent with id agent-unknown not found');
        }
    });

    test('removeJobs should work "Job is assigned."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        // Initially we have
        // Job 1 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        // Job 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.removeJobs(['job-4']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After removal we should have
        // Job 1 -> Agent B
        // Job 3 -> Agent A
        // Job 2 -> unassigned
        // Job 4 -> unassigned
        expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-2')).toBeUndefined();
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')).toBeUndefined();
        expect(modifiedResult.getUnassignedJobs().length).toBe(2);
        expect(modifiedResult.getUnassignedJobs()[0]).toEqual(modifiedResult.getRawData().properties.params.jobs[1]);
    });

    test('removeJobs should work "Job is not assigned."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        // Initially we have
        // Job 1 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        // Job 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.removeJobs(['job-2']);
        let modifiedResult = routeEditor.getModifiedResult();
        // After removal we should have
        // Job 1 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-2')).toBeUndefined();
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getUnassignedJobs().length).toBe(0);
    });

    test('removeJobs should work "Job not found."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        // Initially we have
        // Job 1 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        // Job 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.removeJobs(['job-5']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Job with id job-5 not found');
        }
    });

    test('removeJobs should work "No jobs provided."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        // Initially we have
        // Job 1 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        // Job 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.removeJobs([]);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('No jobs provided');
        }
    });

    test('removeJobs should work "Jobs are not unique."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        // Initially we have
        // Job 1 -> Agent B
        // Job 3 -> Agent A, Job 4 -> Agent B
        // Job 2 -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        try {
            await routeEditor.removeJobs(['job-3', 'job-3']);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Jobs are not unique');
        }
    });

    test('addNewJobs should work "Job assigned to agent, that has existing AgentSolution."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-assigned-agent.json");
        // Initially we have
        // Job 1 -> Agent B, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> Agent B
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let newJob = new Job()
            .setLocation(44.50932929564537, 40.18686625)
            .setPickupAmount(10)
            .setId("job-5");
        await routeEditor.addNewJobs('agent-A', [newJob]);
        let modifiedResult = routeEditor.getModifiedResult();
        // After adding we should have
        // Job 1 -> Agent B, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> Agent B
        // Job 5 -> Agent A
        expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getJobInfo('job-5')!.getAgentId()).toBe('agent-A');
    });

    test('addNewJobs should work "Job assigned to agent without existing AgentSolution."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-unassigned-agent.json");
        // Initially we have
        // Job 1 -> unassigned, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let newJob = new Job()
            .setLocation(44.50932929564537, 40.18686625)
            .setPickupAmount(10)
            .setId("job-5");
        await routeEditor.addNewJobs('agent-B', [newJob]);
        let modifiedResult = routeEditor.getModifiedResult();
        // After adding we should have
        // Job 1 -> unassigned, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        // Job 5 -> Agent B
        expect(modifiedResult.getJobInfo('job-1')).toBeUndefined();
        expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
        expect(modifiedResult.getJobInfo('job-4')).toBeUndefined();
        expect(modifiedResult.getJobInfo('job-5')!.getAgentId()).toBe('agent-B');
        expect(modifiedResult.getUnassignedAgents().length).toBe(0);
        expect(modifiedResult.getUnassignedJobs().length).toBe(2);
        expect(modifiedResult.getUnassignedJobs()[0]).toEqual(modifiedResult.getRawData().properties.params.jobs[0]);
        expect(modifiedResult.getUnassignedJobs()[1]).toEqual(modifiedResult.getRawData().properties.params.jobs[3]);
    });

    test('addNewJobs should work "No jobs provided"', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-unassigned-agent.json");
        // Initially we have
        // Job 1 -> unassigned, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);

        try {
            await routeEditor.addNewJobs('agent-B', []);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('No jobs provided');
        }
    });

    test('addNewJobs should work "Jobs are not unique."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-unassigned-agent.json");
        // Initially we have
        // Job 1 -> unassigned, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let newJob = new Job()
            .setLocation(44.50932929564537, 40.18686625)
            .setPickupAmount(10)
            .setId("job-5");
        try {
            await routeEditor.addNewJobs('agent-B', [newJob, newJob]);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Jobs are not unique');
        }
    });

    test('addNewJobs should work "Job id is undefined."', async () => {
        let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-unassigned-agent.json");
        // Initially we have
        // Job 1 -> unassigned, Job 2 -> Agent A
        // Job 3 -> Agent A, Job 4 -> unassigned
        // Agent B -> unassigned
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        let id: string;
        let newJob = new Job()
            .setLocation(44.50932929564537, 40.18686625)
            .setPickupAmount(10)
            .setId(id!);
        try {
            await routeEditor.addNewJobs('agent-B', [newJob]);
            fail();
        } catch (error: any) {
            expect(error.message).toBe('Job id is undefined');
        }
    });

    test('removeJobs should work "No issues found."', async () => {
        let assignJobRawData: RoutePlannerResultResponseData = loadJson("data/route-planner-result-editor/job/raw-result-has-no-issues.json");
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignJobRawData);

        const routeEditor = new RoutePlannerResultEditor(plannerResult);
        await routeEditor.removeJobs(['11']);
        let modifiedResult = routeEditor.getModifiedResult();

        expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    });
});