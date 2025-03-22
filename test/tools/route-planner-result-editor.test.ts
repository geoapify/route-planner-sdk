import RoutePlanner, {
  RoutePlannerResultEditor,
  RoutePlannerResultData, Agent, Job, Shipment, ShipmentStep,
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
    let agentToAssignTheJob = result.getJobInfo('job-2')!.getAgentId() == 'agent-B' ? 'agent-A' : 'agent-B';
    await routeEditor.assignJobs(agentToAssignTheJob, ['job-2']);
    expect(result.getJobInfo('job-2')!.getAgentId()).toBe(agentToAssignTheJob);
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
    expect(result.getRaw().inputData).toBeDefined();

    const routeEditor = new RoutePlannerResultEditor(result);
    result.getRaw().inputData.agents.forEach(agent => {
      agent.capabilities = ['heavy-items', 'small-items'];
    })
    let agentToAssignTheShipment = result.getShipmentInfo('shipment-2')!.getAgentId() == 'agent-B' ? 'agent-A' : 'agent-B';
    await routeEditor.assignShipments(agentToAssignTheShipment, ['shipment-2']);
    expect(result.getShipmentInfo('shipment-2')!.getAgentId()).toBe(agentToAssignTheShipment);
  });


  test('assignJobs should work "AgentSolution for provided agentId is found and the job is assigned to someone else."', async () => {
    let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
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

  test('assignJobs should work "AgentSolution for provided agentId is found. But the job is not assigned to anyone."', async () => {
    let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
    // Initially we have
    // Job 1 -> Agent B
    // Job 3 -> Agent A, Job 4 -> Agent B
    // Job 2 -> unassigned
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
    expect(plannerResult.getUnassignedJobs().length).toBe(0);
  });


  test('assignJobs should work "AgentSolution for provided agentId is not found and the job is assigned to someone."', async () => {
    let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-assigned.json");
    // Initially we have
    // Job 1 -> unassigned, Job 2 -> Agent A
    // Job 3 -> Agent A, Job 4 -> unassigned
    // Agent B -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignJobRawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignJobs('agent-B', ['job-2']);
    // After assignment we should have
    // Job 1 -> unassigned, Job 2 -> Agent B
    // Job 3 -> Agent A, Job 4 -> unassigned
    expect(plannerResult.getJobInfo('job-1')).toBeUndefined();
    expect(plannerResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getJobInfo('job-4')).toBeUndefined();
    expect(plannerResult.getUnassignedAgents().length).toBe(0);
    expect(plannerResult.getUnassignedJobs().length).toBe(2);
    expect(plannerResult.getUnassignedJobs()[0]).toBe(0);
    expect(plannerResult.getUnassignedJobs()[1]).toBe(3);
  });

  test('assignJobs should work "AgentSolution for provided agentId is not found and the job is not assigned to anyone."', async () => {
    let assignJobRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
    // Initially we have
    // Job 1 -> unassigned, Job 2 -> Agent A
    // Job 3 -> Agent A, Job 4 -> unassigned
    // Agent B -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignJobRawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignJobs('agent-B', ['job-1']);
    // After assignment we should have
    // Job 1 -> Agent B, Job 2 -> Agent A
    // Job 3 -> Agent A, Job 4 -> unassigned
    expect(plannerResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getJobInfo('job-3')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getJobInfo('job-4')).toBeUndefined();
    expect(plannerResult.getUnassignedAgents().length).toBe(0);
    expect(plannerResult.getUnassignedJobs().length).toBe(1);
    expect(plannerResult.getUnassignedJobs()[0]).toBe(3);
  });

  test('assignShipments should work "AgentSolution for provided agentId is found and the shipment is assigned to someone else."', async () => {
    let assignShipmentRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    // Initially we have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignShipmentRawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-A', ['shipment-3']);
    // After assignment we should have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent A, Shipment 4 -> Agent B
    expect(plannerResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
  });

  test('assignShipments should work "AgentSolution for provided agentId is found. But the shipment is not assigned to anyone."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-unassigned.json");
    // Initially we have
    // Shipment 1 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    // Shipment 2 -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignShipmentsRawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-A', ['shipment-2']);
    // After assignment we should have
    // Shipment 1 -> Agent A, Shipment 2 -> Agent A
    // Shipment 3 -> Agent B, Shipment 4 -> Agent B
    expect(plannerResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getUnassignedShipments().length).toBe(0);
  });


  test('assignShipments should work "AgentSolution for provided agentId is not found and the shipment is assigned to someone."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-assigned.json");
    // Initially we have
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    // Agent B -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignShipmentsRawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-B', ['shipment-2']);
    // After assignment we should have
    // Shipment 1 -> A, Shipment 2 -> Agent B
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    expect(plannerResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getShipmentInfo('shipment-3')).toBeUndefined();
    expect(plannerResult.getShipmentInfo('shipment-4')).toBeUndefined();
    expect(plannerResult.getUnassignedAgents().length).toBe(0);
    expect(plannerResult.getUnassignedShipments().length).toBe(2);
    expect(plannerResult.getUnassignedShipments()[0]).toBe(2);
    expect(plannerResult.getUnassignedShipments()[1]).toBe(3);
  });

  test('assignShipments should work "AgentSolution for provided agentId is not found and the shipment is not assigned to anyone."', async () => {
    let assignShipmentsRawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
    // Initially we have
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> unassigned, Shipment 4 -> unassigned
    // Agent B -> unassigned
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, assignShipmentsRawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.assignShipments('agent-B', ['shipment-3']);
    // Shipment 1 -> A, Shipment 2 -> Agent A
    // Shipment 3 -> B, Shipment 4 -> unassigned
    expect(plannerResult.getShipmentInfo('shipment-1')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-2')!.getAgentId()).toBe('agent-A');
    expect(plannerResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(plannerResult.getShipmentInfo('shipment-4')).toBeUndefined();
    expect(plannerResult.getUnassignedAgents().length).toBe(0);
    expect(plannerResult.getUnassignedShipments().length).toBe(1);
    expect(plannerResult.getUnassignedShipments()[0]).toBe(3);
  });
});
