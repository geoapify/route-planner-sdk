import RoutePlanner, {
  RoutePlannerResultEditor,
  RoutePlannerResultData, Agent, Job, Shipment, ShipmentStep, Location
} from "../../src";
import { RoutePlannerResult } from "../../src/models/entities/route-planner-result";
import { loadJson } from "../utils.helper";
import TEST_API_KEY from "../../env-variables";
import {RoutePlannerResultReverseConverter} from "../route-planner-result-reverse-converter";

const API_KEY = TEST_API_KEY;

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

  test('assignShipments should work as expected for simple case"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent()
        .setStartLocation(44.50932929564537, 40.18686625)
        .addCapability('heavy-items')
        .setId("agent-A"));

    planner.addAgent(new Agent()
        .setStartLocation(44.400450399509495,40.153735600000005)
        .addCapability('small-items')
        .setId("agent-B"));

    planner.addShipment(new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('heavy-items')
        .setId("shipment-1"));
    planner.addShipment(new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.511160727462574, 40.1816037).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('heavy-items')
        .setId("shipment-2"));
    planner.addShipment(new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.517954005538606, 40.18518455).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('small-items')
        .setId("shipment-3"));
    planner.addShipment(new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.5095432, 40.18665755000001).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('small-items')
        .setId("shipment-4"));

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.getAgentSolutions().length).toBe(2);
    expect(result.getData().inputData).toBeDefined();

    const routeEditor = new RoutePlannerResultEditor(result);
    let modifiedResult = routeEditor.getModifiedResult();
    modifiedResult.getRawData().properties.params.agents.forEach(agent => {
      agent.capabilities = ['heavy-items', 'small-items'];
    })
    let agentToAssignTheShipment = result.getShipmentInfo('shipment-2')!.getAgentId() == 'agent-B' ? 'agent-A' : 'agent-B';
    await routeEditor.assignShipments(agentToAssignTheShipment, ['shipment-2']);
    expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe(agentToAssignTheShipment);
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
    expect(modifiedResult.getUnassignedJobs()[0]).toBe(0);
    expect(modifiedResult.getUnassignedJobs()[1]).toBe(3);
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
    expect(modifiedResult.getUnassignedJobs()[0]).toBe(3);
  });

  test('assignShipments should work "AgentSolution for provided agentId is found and the shipment is assigned to someone else."', async () => {
    let assignShipmentRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    // Initially we have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-A', ['shipment-3']);
    let modifiedResult = routeEditor.getModifiedResult();
    // After assignment we should have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent A, Shipment 4 -> Agent B
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
  });

  test('assignShipments should work "AgentSolution for provided agentId is found. But the shipment is not assigned to anyone."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
    // Initially we have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    // Shipment 2 -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-A', ['shipment-2']);
    let modifiedResult = routeEditor.getModifiedResult();
    // After assignment we should have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedShipments().length).toBe(0);
  });


  test('assignShipments should work "AgentSolution for provided agentId is not found and the shipment is assigned to someone."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
    // Initially we have
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    // Agent B -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-B', ['shipment-2']);
    let modifiedResult = routeEditor.getModifiedResult();
    // After assignment we should have
    // Shipment 1 -> A, Shipment 2 -> Agent B
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-3')).toBeUndefined();
    expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expect(modifiedResult.getUnassignedShipments().length).toBe(2);
    expect(modifiedResult.getUnassignedShipments()[0]).toBe(2);
    expect(modifiedResult.getUnassignedShipments()[1]).toBe(3);
  });

  test('assignShipments should work "AgentSolution for provided agentId is not found and the shipment is not assigned to anyone."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
    // Initially we have
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    // Agent B -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-B', ['shipment-3']);
    let modifiedResult = routeEditor.getModifiedResult();
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> B, Shipment 4 -> unassigned
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0]).toBe(3);
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
    expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getJobInfo('job-2')).toBeUndefined();
    expect(modifiedResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getJobInfo('job-4')).toBeUndefined();
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    expect(modifiedResult.getUnassignedJobs()[0]).toBe(1);
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

  test('removeJobs should work "Agent is not assigned."', async () => {
    let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
    // Initially we have
    // Job 1 -> Agent B
    // Job 3 -> Agent A, Job 4 -> Agent B
    // Job 2 -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignJobRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.removeJobs(['job-3']);
    let modifiedResult = routeEditor.getModifiedResult();
    // After removal we should have
    // Job 1 -> Agent B
    // Job 4 -> Agent B
    expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getJobInfo('job-2')).toBeUndefined();
    expect(modifiedResult.getJobInfo('job-3')).toBeUndefined();
    expect(modifiedResult.getJobInfo('job-4')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
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

  test('removeShipments should work "Shipment is assigned."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
    // Initially we have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    // Shipment 2 -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.removeShipments(['shipment-4']);
    let modifiedResult = routeEditor.getModifiedResult();
    // After removal we should have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B
    // Shipment 2 -> unassigned
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')).toBeUndefined();
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0]).toBe(1);
  });

  test('removeShipments should work "Shipment is not assigned."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
    // Initially we have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    // Shipment 2 -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.removeShipments(['shipment-2']);
    let modifiedResult = routeEditor.getModifiedResult();
    // After removal we should have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')).toBeUndefined();
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedShipments().length).toBe(0);
  });

  test('removeShipments should work "Agent is not assigned."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
    // Initially we have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    // Shipment 2 -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.removeShipments(['shipment-1']);
    let modifiedResult = routeEditor.getModifiedResult();
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    expect(modifiedResult.getShipmentInfo('shipment-1')).toBeUndefined();
    expect(modifiedResult.getShipmentInfo('shipment-2')).toBeUndefined();
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
  });

  test('removeShipments should work "Shipment not found."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
    // Initially we have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    // Shipment 2 -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    try {
      await routeEditor.removeShipments(['shipment-5']);
      fail();
    } catch (error: any) {
      expect(error.message).toBe('Shipment with id shipment-5 not found');
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
    expect(modifiedResult.getUnassignedJobs()[0]).toBe(0);
    expect(modifiedResult.getUnassignedJobs()[1]).toBe(3);
  });

  test('addNewShipments should work "Shipment assigned to agent, that has existing AgentSolution."', async () => {
    let assignShipmentRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-add-shipment-success-assigned-agent.json");
    // Initially we have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newShipment = new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('heavy-items')
        .setId("shipment-5");
    await routeEditor.addNewShipments('agent-A', [newShipment]);
    let modifiedResult = routeEditor.getModifiedResult();
    // After adding we should have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    // Shipment 5 -> Agent A
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getShipmentInfo('shipment-5')!.getAgentId()).toBe('agent-A');
  });

  test('addNewShipments should work "Shipment assigned to agent without existing AgentSolution."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
    // Initially we have
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    // Agent B -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(assignShipmentsRawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newShipment = new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('heavy-items')
        .setId("shipment-5");
    await routeEditor.addNewShipments('agent-B', [newShipment]);
    let modifiedResult = routeEditor.getModifiedResult();
    // After adding we should have
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    // Shipment 5 -> Agent B
    expect(modifiedResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(modifiedResult.getShipmentInfo('shipment-3')).toBeUndefined();
    expect(modifiedResult.getShipmentInfo('shipment-4')).toBeUndefined();
    expect(modifiedResult.getShipmentInfo('shipment-5')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expect(modifiedResult.getUnassignedShipments().length).toBe(2);
    expect(modifiedResult.getUnassignedShipments()[0]).toBe(2);
    expect(modifiedResult.getUnassignedShipments()[1]).toBe(3);
  });

  test('Complex scenario: should not throw an exception', async () => {
    const planner = new RoutePlanner({ apiKey: API_KEY });
    planner.setMode("drive");
    planner.addAgent(new Agent().setId('agent-a').setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new Agent().setId('agent-b').setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setId('agent-c').setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.511160727462574, 40.1816037));
    planner.addJob(new Job().setDuration(300).setPickupAmount(60).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setId('job-2').setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));
    planner.addShipment(new Shipment().setId("shipment-1")
    .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50129564537, 40.18686625))
    .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)));
    const result = await planner.plan();

    console.log(result);

    const routeEditor = new RoutePlannerResultEditor(result);
    await routeEditor.assignShipments('agent-c', ['shipment-1']);

    let modifiedResult = routeEditor.getModifiedResult();
  });

  test('Complex scenario: should throw an error if not array is passed', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});
    planner.setMode("drive");
    planner.addAgent(new Agent().setId('agent-a').setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new Agent().setId('agent-b').setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setId('agent-c').setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.511160727462574, 40.1816037));
    planner.addJob(new Job().setDuration(300).setPickupAmount(60).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setId('job-2').setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));
    planner.addShipment(new Shipment().setId("shipment-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50129564537, 40.18686625))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)));
    const result = await planner.plan();

    console.log(result);

    const routeEditor = new RoutePlannerResultEditor(result);
    try {
      await routeEditor.removeJobs('job-2' as any);
    } catch (error: any) {
      expect(error.message).toBe('Type error: jobIds must be an array');
    }
  });

  test('Complex scenario: unassignedJobs in data and in rawData should return the same value', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});
    planner.setMode("drive");
    planner.addAgent(new Agent().setId('agent-a').setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new Agent().setId('agent-b').setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setId('agent-c').setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.511160727462574, 40.1816037));
    planner.addJob(new Job().setId('job-1').setDuration(300).setPickupAmount(60).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setId('job-2').setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));
    planner.addShipment(new Shipment().setId("shipment-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50129564537, 40.18686625))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)));
    const result = await planner.plan();

    console.log(result);

    const routeEditor = new RoutePlannerResultEditor(result);
    await routeEditor.removeJobs(['job-2']);

    let modifiedResult = routeEditor.getModifiedResult();
    console.log(JSON.stringify(modifiedResult));
  });

  test('If agent is not used, then AgentSolution array should contain an undefined item', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});
    planner.setMode("drive");
    planner.addAgent(new Agent().setId('agent-a').setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new Agent().setId('agent-b').setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setId('agent-c').setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.511160727462574, 40.1816037));
    planner.addJob(new Job().setId('job-1').setDuration(300).setPickupAmount(60).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setId('job-2').setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));
    planner.addShipment(new Shipment().setId("shipment-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50129564537, 40.18686625))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)));
    const result = await planner.plan();
    let allAgentSolution = result.getAgentSolutionsByIndex();
    expect(allAgentSolution[0]).toBeDefined();
    expect(allAgentSolution[1]).toBeUndefined();
    expect(allAgentSolution[2]).toBeUndefined();
  });
});
