import RoutePlanner, {
  RoutePlannerResultEditor,
  RoutePlannerResultData, Agent, Job,
} from "../../src";
import { RoutePlannerResult } from "../../src/models/entities/route-planner-result";
import { loadJson } from "../utils.helper";

const API_KEY = "TEST_API_KEY";

describe('RoutePlannerResultEditor', () => {

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
    expect(result.getRaw().inputData).toBeDefined();

    const routeEditor = new RoutePlannerResultEditor(result);
    result.getRaw().inputData.agents.forEach(agent => {
      agent.pickup_capacity = 100;
    })
    let agentToAssignTheJob = result.getJobInfo('job-2')!.getAgentId() == 'agent-B' ? 'agent-A' : 'agent-A';
    await routeEditor.assignJobs(agentToAssignTheJob, ['job-2']);
    expect(result.getJobInfo('job-2')!.getAgentId()).toBe(agentToAssignTheJob);
  });


  test('assignJobs should work as expected for simple case (request data mocked)', async () => {
    let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/result-data-simple.json");
    // Initially we have
    // Job 1 -> Agent B, Job 2 -> Agent A
    // Job 3 -> Agent A, Job 4 -> Agent B
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignJobRawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignJobs('agent-B', ['job-2']);
    // After assignment we should have
    // Job 1 -> Agent B, Job 2 -> Agent B
    // Job 3 -> Agent A, Job 4 -> Agent B
    expect(plannerResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getJobInfo('job-4')!.getAgentId()).toBe('agent-B');
  });

  // test('assignJobs should work as expected if as a result we have unassignedJobs"', async () => {
  //   const planner = new RoutePlanner({apiKey: API_KEY});
  //
  //   planner.setMode("drive");
  //
  //   planner.addAgent(new Agent()
  //       .setStartLocation(44.45876306369348,40.22179735)
  //       .setPickupCapacity(100)
  //       .setId("agent-A"));
  //
  //   planner.addAgent(new Agent()
  //       .setStartLocation(44.400450399509495,40.153735600000005)
  //       .setPickupCapacity(100)
  //       .setId("agent-B"));
  //
  //   planner.addJob(new Job()
  //       .setLocation(44.50932929564537, 40.18686625)
  //       .setPickupAmount(10)
  //       .setId("job-1"));
  //   planner.addJob(new Job()
  //       .setLocation(44.511160727462574, 40.1816037)
  //       .setPickupAmount(10)
  //       .setPriority(10)
  //       .setId("job-2"));
  //
  //   planner.addJob(new Job()
  //       .setLocation(44.517954005538606, 40.18518455)
  //       .setPickupAmount(10)
  //       .setPriority(10)
  //       .setId("job-3"));
  //   planner.addJob(new Job()
  //       .setLocation(44.5095432, 40.18665755000001)
  //       .setPickupAmount(10)
  //       .setPriority(10)
  //       .setId("job-4"));
  //
  //   const result = await planner.plan();
  //   expect(result).toBeDefined();
  //   expect(result.getAgentSolutions().length).toBe(1);
  //   expect(result.getRaw().inputData).toBeDefined();
  //
  //   const routeEditor = new RoutePlannerResultEditor(result);
  //   await routeEditor.assignJobs('agent-B', ['job-1']);
  //   expect(result.getJobInfo('job-1')).toBeUndefined();
  //   expect(result.getJobInfo('job-2')!.getAgentId()).toBe('agent-A');
  //   expect(result.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
  //   expect(result.getJobInfo('job-4')!.getAgentId()).toBe('agent-A');
  //   expect(result.getUnassignedJobs().length).toBe(1);
  //   expect(result.getUnassignedJobs()[0]).toBe('1');
  // });
});
