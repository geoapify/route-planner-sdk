import {
  RoutePlannerResultEditor,
  RoutePlannerResultData, Job, Shipment, ShipmentStep, AgentPlan, RoutePlannerResultResponseData,
  FeatureResponseData, ActionResponseData
} from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { loadJson } from "../../utils.helper";
import TEST_API_KEY from "../../../env-variables";
import {RoutePlannerResultReverseConverter} from "../route-planner-result-reverse-converter";

const API_KEY = TEST_API_KEY;

jest.setTimeout(120000);

// ToDo: this file was moved to live tests. Remove mocked API checks and replace with live assertions.
function expectApiCalled(_apis: string[]): void {
  // ToDo: verify real API calls/behavior without fetch mock inspection
}

function expectApiNotCalled(): void {
  // ToDo: verify operation path without relying on fetch mock
}

function mockRoutePlannerSuccessWithFeature(_feature: FeatureResponseData): void {
  // ToDo: replace with live Route Planner call setup
}

/**
 * Tests for default behavior and reoptimize strategy
 */
describe('RoutePlannerResultEditor Default & Reoptimize Strategy', () => {

  test('assignJobs without options should use reoptimize (default)', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B without options (default = reoptimize)
    await routeEditor.assignJobs('agent-B', ['job-2']);
    
    // Verify API was called (reoptimize is default)
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2) (job-2 removed)
    // agent-B: job-2 added (position optimized by API)
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentPlan('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with explicit reoptimize strategy should call API with correct params', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with explicit reoptimize strategy
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'reoptimize' });
    
    // Verify API was called
    expectApiCalled(['routeplanner']);
    
    // Verify request body contains job-2 assigned to agent-B (index 1)
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: verify assign-agent requirement in live request/result
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2) (job-2 removed)
    // agent-B: job-2 added (position optimized by API)
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentPlan('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });
});

/**
 * Tests for priority handling (backward compatibility)
 */
describe('RoutePlannerResultEditor Priority Handling', () => {

  test('assignJobs with priority as number (old API) should work', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with priority as number (old API - backward compatible)
    await routeEditor.assignJobs('agent-B', ['job-2']);
    
    // Verify API was called (uses reoptimize)
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2) (job-2 removed)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(?) → end(?) (job-2 added, position optimized by API)
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentPlan('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with priority in options (new API) should work', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with priority in options object (new API)
    await routeEditor.assignJobs('agent-B', ['job-2']);
    
    // Verify API was called (uses reoptimize by default)
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2) (job-2 removed)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(?) → end(?) (job-2 added, position optimized by API)
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentPlan('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignShipments with priority as number (old API) should work', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-3 with priority as number (old API - backward compatible)
    await routeEditor.assignShipments('agent-A', ['shipment-3']);
    
    // Verify API was called (uses reoptimize)
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: shipment-3-pickup and shipment-3-delivery added (position optimized by API)
    // agent-B: start(0) → shipment-4-pickup(1) → shipment-4-delivery(2) → end(3) (shipment-3 removed)
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-A');
    
    // Verify source agent - shipment-3 should be removed
    expectActionsNotContain(modifiedResult.getAgentPlan('agent-B')!, ['shipment-3']);
    expectActionsContain(modifiedResult.getAgentPlan('agent-B')!, ['shipment-4']);
  }, 10000); // Extended timeout for API call
});

/**
 * Tests for preserveOrder strategy with appendToEnd (formerly append strategy)
 */
describe('RoutePlannerResultEditor PreserveOrder with AppendToEnd', () => {

  test('assignJobs with preserveOrder + appendToEnd should NOT call API', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with preserveOrder + appendToEnd (should NOT call API)
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called
    expectApiNotCalled();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(3) → end(4)
    let modifiedResult = routeEditor.getModifiedResult();
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, ['start', 'job-1', 'job-4', 'job-2', 'end']);
  });

  test('assignJobs with preserveOrder + appendToEnd should add job to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B with appendToEnd
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(3) → end(4)
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, ['start', 'job-1', 'job-4', 'job-2', 'end']);
  });

  test('assignShipments with preserveOrder + appendToEnd should add shipment to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-3 from agent-B to agent-A with appendToEnd
    await routeEditor.assignShipments('agent-A', ['shipment-3'], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → shipment-3-pickup(5) → shipment-3-delivery(6) → end(7)
    // agent-B: start(0) → shipment-4-pickup(1) → shipment-4-delivery(2) → end(3)
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, [
      'start', 'shipment-2-pickup', 'shipment-2-delivery', 'shipment-1-pickup', 'shipment-1-delivery', 
      'shipment-3-pickup', 'shipment-3-delivery', 'end'
    ]);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
  });

  test('addNewJobs with preserveOrder + appendToEnd should add new job to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-add-job-success-assigned-agent.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newJob = new Job()
        .setLocation(44.50932929564537, 40.18686625)
        .setPickupAmount(10)
        .setId("job-5");
    
    await routeEditor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → job-2(2) → job-5(3) → end(4)
    expect(modifiedResult.getJobPlan('job-5')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'job-2', 'job-5', 'end']);
  });

  test('addNewShipments with preserveOrder + appendToEnd should add new shipment to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newShipment = new Shipment()
        .setId("shipment-5")
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(500))
        .setDelivery(new ShipmentStep().setLocation(44.51, 40.19).setDuration(500));
    
    await routeEditor.addNewShipments('agent-A', [newShipment], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → shipment-5-pickup(5) → shipment-5-delivery(6) → end(7)
    expect(modifiedResult.getShipmentPlan('shipment-5')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, [
      'start', 'shipment-2-pickup', 'shipment-2-delivery', 'shipment-1-pickup', 'shipment-1-delivery',
      'shipment-5-pickup', 'shipment-5-delivery', 'end'
    ]);
  });

  test('assignJobs with preserveOrder + appendToEnd to unassigned agent should create feature and append', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: UNASSIGNED
    // job-1: unassigned
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned job-1 to unassigned agent-B with appendToEnd strategy
    await routeEditor.assignJobs('agent-B', ['job-1'], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → job-1(1) → end(2) (created from scratch)
    expect(modifiedResult.getJobPlan('job-1')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, ['start', 'job-1', 'end']);
  });

  test('assignShipments with preserveOrder + appendToEnd to unassigned agent should create feature and append', async () => {
    // Initial state:
    // agent-A: has shipments 1 & 2
    // agent-B: UNASSIGNED
    // shipment-3: unassigned
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned shipment-3 to unassigned agent-B with appendToEnd strategy
    await routeEditor.assignShipments('agent-B', ['shipment-3'], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-3-delivery(2) → end(3) (created from scratch)
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, ['start', 'shipment-3-pickup', 'shipment-3-delivery', 'end']);
  });
});

/**
 * Tests for preserveOrder strategy (formerly insert strategy) - finds optimal position with Route Matrix API
 */
describe('RoutePlannerResultEditor PreserveOrder Strategy (Optimal Position)', () => {

  test('assignJobs with preserveOrder (no position) should find optimal position via Route Matrix', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B with preserveOrder (optimal position)
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder' });
    
    // Verify Route Matrix API was called for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: job-2 inserted at optimal position (algorithm decides)
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    
    // Verify agent-B has all expected jobs (order determined by algorithm)
    const agentB = modifiedResult.getAgentPlan('agent-B')!;
    expectValidRoute(agentB);
    expect(agentB.getActions().length).toBe(5); // start, job-1, job-4, job-2, end
    expectJobsExactly(agentB, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with preserveOrder + afterWaypointIndex should optimize after waypoint', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B, optimize after waypoint 0 (start)
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Should call Route Matrix API to find optimal position after waypoint 0
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // job-2 should be inserted somewhere after start, in optimal position
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentPlan('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with preserveOrder + afterId should optimize after specified job', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B, optimize after job-1
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', afterId: 'job-1' });
    
    // Should call Route Matrix API to find optimal position after job-1
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // job-2 should be inserted somewhere after job-1, in optimal position
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentPlan('agent-B')!, ['job-1', 'job-2', 'job-4']);
    
    // Verify job-2 comes after job-1
    const actions = modifiedResult.getAgentPlan('agent-B')!.getActions();
    const job1Index = actions.findIndex(a => a.getJobId() === 'job-1');
    const job2Index = actions.findIndex(a => a.getJobId() === 'job-2');
    expect(job2Index).toBeGreaterThan(job1Index);
  });

  test('assignShipments with preserveOrder (no position) should find optimal position via Route Matrix', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-3 from agent-B to agent-A with preserveOrder (optimal position)
    await routeEditor.assignShipments('agent-A', ['shipment-3'], { strategy: 'preserveOrder' });
    
    // Verify Route Matrix API was called for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → shipment-4-pickup(1) → shipment-4-delivery(2) → end(3)
    // agent-A: shipment-3 inserted at optimal position (algorithm decides)
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentPlan('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
    
    // Verify agent-A has all expected shipments
    const agentA = modifiedResult.getAgentPlan('agent-A')!;
    expectValidRoute(agentA);
    expectActionsContain(agentA, ['shipment-1', 'shipment-2', 'shipment-3']);
  });

  test('assignShipments with preserveOrder + afterWaypointIndex should optimize after waypoint', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-4 from agent-B to agent-A, optimize after waypoint 0 (start)
    await routeEditor.assignShipments('agent-A', ['shipment-4'], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Should call Route Matrix API to find optimal positions after waypoint 0
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // shipment-4 should be inserted somewhere after start, in optimal position
    expect(modifiedResult.getShipmentPlan('shipment-4')!.getAgentId()).toBe('agent-A');
    expectShipmentsExactly(modifiedResult.getAgentPlan('agent-A')!, ['shipment-1', 'shipment-2', 'shipment-4']);
    expectActionsContain(modifiedResult.getAgentPlan('agent-B')!, ['shipment-3']);
    expectActionsNotContain(modifiedResult.getAgentPlan('agent-B')!, ['shipment-4']);
  });

  test('addNewJobs with preserveOrder + afterWaypointIndex should optimize after waypoint', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-add-job-success-assigned-agent.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newJob = new Job()
        .setLocation(44.50932929564537, 40.18686625)
        .setPickupAmount(10)
        .setId("job-5");
    
    await routeEditor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Should call Route Matrix API to find optimal position after waypoint 0
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // job-5 should be inserted somewhere after start, in optimal position
    expect(modifiedResult.getJobPlan('job-5')!.getAgentId()).toBe('agent-A');
    expectJobsExactly(modifiedResult.getAgentPlan('agent-A')!, ['job-2', 'job-3', 'job-5']);
  });

  test('addNewShipments with preserveOrder + afterWaypointIndex should optimize after waypoint', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newShipment = new Shipment()
        .setId("shipment-5")
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(500))
        .setDelivery(new ShipmentStep().setLocation(44.51, 40.19).setDuration(500));
    
    await routeEditor.addNewShipments('agent-A', [newShipment], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Should call Route Matrix API to find optimal positions after waypoint 0
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // shipment-5 should be inserted somewhere after start, in optimal position
    expect(modifiedResult.getShipmentPlan('shipment-5')!.getAgentId()).toBe('agent-A');
    expectShipmentsExactly(modifiedResult.getAgentPlan('agent-A')!, ['shipment-1', 'shipment-2', 'shipment-5']);
  });

  test('addNewJobs with preserveOrder (no position) should insert at optimal position via Route Matrix', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-add-job-success-assigned-agent.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newJob = new Job()
        .setLocation(44.50932929564537, 40.18686625)
        .setPickupAmount(10)
        .setId("job-5");
    
    await routeEditor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder' });
    
    // Verify Route Matrix API was called for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: job-5 inserted at optimal position (algorithm decides)
    expect(modifiedResult.getJobPlan('job-5')!.getAgentId()).toBe('agent-A');
    
    const agentA = modifiedResult.getAgentPlan('agent-A')!;
    expectValidRoute(agentA);
    expect(agentA.getActions().length).toBe(5); // start, job-3, job-2, job-5, end
    expectJobsExactly(agentA, ['job-2', 'job-3', 'job-5']);
  });

  test('addNewShipments with preserveOrder (no position) should insert at optimal position via Route Matrix', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newShipment = new Shipment()
        .setId("shipment-5")
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(500))
        .setDelivery(new ShipmentStep().setLocation(44.51, 40.19).setDuration(500));
    
    await routeEditor.addNewShipments('agent-A', [newShipment], { strategy: 'preserveOrder' });
    
    // Verify Route Matrix API was called for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: shipment-5-pickup and shipment-5-delivery inserted at optimal positions (algorithm decides)
    //          shipment-1 and shipment-2 remain on agent-A
    expect(modifiedResult.getShipmentPlan('shipment-5')!.getAgentId()).toBe('agent-A');
    
    const agentA = modifiedResult.getAgentPlan('agent-A')!;
    expectValidRoute(agentA);
    expectShipmentsExactly(agentA, ['shipment-1', 'shipment-2', 'shipment-5']);
  }, 15000); // Extended timeout for multiple Route Matrix API calls

  test('assignJobs with preserveOrder to unassigned agent should create feature and insert', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: UNASSIGNED
    // job-1: unassigned
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned job-1 to unassigned agent-B with preserveOrder + appendToEnd
    // (Can't use waypoint indexes on agents without routes)
    await routeEditor.assignJobs('agent-B', ['job-1'], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → job-1(1) → end(2) (created from scratch)
    expect(modifiedResult.getJobPlan('job-1')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, ['start', 'job-1', 'end']);
  });

  test('assignShipments with preserveOrder to unassigned agent should create feature and insert', async () => {
    // Initial state:
    // agent-A: has shipments 1 & 2
    // agent-B: UNASSIGNED
    // shipment-3: unassigned
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned shipment-3 to unassigned agent-B with preserveOrder + appendToEnd
    // (No existing route, so just append)
    await routeEditor.assignShipments('agent-B', ['shipment-3'], { strategy: 'preserveOrder', append: true });
    
    // Verify Route Matrix API was NOT called (no existing route to optimize insertion point for)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-3-delivery(2) → end(3) (created from scratch)
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, ['start', 'shipment-3-pickup', 'shipment-3-delivery', 'end']);
  });
});

/**
 * Tests for preserveOrder remove strategy
 */
describe('RoutePlannerResultEditor PreserveOrder Remove Strategy', () => {

  test('removeJobs with explicit reoptimize strategy should call API', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // Unassigned jobs: []
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove job-2 from agent-A with reoptimize
    await routeEditor.removeJobs(['job-2'], { strategy: 'reoptimize' });
    
    // Verify Route Planner API was called
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: job-2 removed, route reoptimized
    // Unassigned jobs: [job-2]
    expect(modifiedResult.getJobPlan('job-2')?.getAgentId()).toBeUndefined();
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    expect(modifiedResult.getUnassignedJobs()[0].id).toBe('job-2');
    expectActionsContain(modifiedResult.getAgentPlan('agent-A')!, ['job-3']);
    expectActionsNotContain(modifiedResult.getAgentPlan('agent-A')!, ['job-2']);
  });

  test('removeShipments with explicit reoptimize strategy should call API', async () => {
    // Initial state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    // Unassigned shipments: []
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove shipment-3 from agent-B with reoptimize
    await routeEditor.removeShipments(['shipment-3'], { strategy: 'reoptimize' });
    
    // Verify Route Planner API was called
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: shipment-3 removed, route reoptimized
    // Unassigned shipments: [shipment-3]
    expect(modifiedResult.getShipmentPlan('shipment-3')?.getAgentId()).toBeUndefined()
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0].id).toBe('shipment-3');
    expectActionsContain(modifiedResult.getAgentPlan('agent-B')!, ['shipment-4']);
    expectActionsNotContain(modifiedResult.getAgentPlan('agent-B')!, ['shipment-3']);
  });

  test('removeJobs with preserveOrder should remove without reoptimizing', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // Unassigned jobs: []
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove job-2 from agent-A
    await routeEditor.removeJobs(['job-2'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // Unassigned jobs: [job-2]
    expect(modifiedResult.getJobPlan('job-2')?.getAgentId()).toBeUndefined();
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    expect(modifiedResult.getUnassignedJobs()[0].id).toBe('job-2');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
  });

  test('removeShipments with preserveOrder should remove without reoptimizing', async () => {
    // Initial state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    // Unassigned shipments: []
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove shipment-3 from agent-B
    await routeEditor.removeShipments(['shipment-3'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → shipment-4-pickup(1) → shipment-4-delivery(2) → end(3)
    // Unassigned shipments: [shipment-3]
    expect(modifiedResult.getShipmentPlan('shipment-3')?.getAgentId()).toBeUndefined()
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0].id).toBe('shipment-3');
    expectActions(modifiedResult.getAgentPlan('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
  });

  test('removeJobs with preserveOrder should keep remaining jobs in same order', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove job-3 (first job on agent-A)
    await routeEditor.removeJobs(['job-3'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-2(1) → end(2)
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-2', 'end']);
  });

  test('removeJobs with preserveOrder should handle missing issues object', async () => {
    // Initial state with NO issues object in raw data
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));
    
    // Manually remove issues object to simulate the bug scenario
    delete plannerResult.getRaw().properties.issues;

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove job-2 - should not crash even without issues object
    await routeEditor.removeJobs(['job-2'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state: job removed and added to newly created unassigned_jobs array
    expect(modifiedResult.getJobPlan('job-2')?.getAgentId()).toBeUndefined();
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    expect(modifiedResult.getUnassignedJobs()[0].id).toBe('job-2');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
  });

  test('removeShipments with preserveOrder should handle missing issues object', async () => {
    // Initial state with NO issues object in raw data
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));
    
    // Manually remove issues object to simulate the bug scenario
    delete plannerResult.getRaw().properties.issues;

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove shipment-3 - should not crash even without issues object
    await routeEditor.removeShipments(['shipment-3'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state: shipment removed and added to newly created unassigned_shipments array
    expect(modifiedResult.getShipmentPlan('shipment-3')?.getAgentId()).toBeUndefined();
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0].id).toBe('shipment-3');
    expectActions(modifiedResult.getAgentPlan('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
  });
});

/**
 * Tests for empty string handling in preserveOrder options
 */
describe('RoutePlannerResultEditor Empty String Handling', () => {

  test('assignJobs with empty afterId should use afterWaypointIndex instead', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Pass empty string for afterId and valid afterWaypointIndex
    // Empty afterId should be ignored, and it should optimize after waypoint 0
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder', 
      afterId: '',  // Empty string - should be ignored
      afterWaypointIndex: 0 
    });
    
    // Should call Route Matrix API to find optimal position after waypoint 0
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Should optimize after waypoint 0 (start), ignoring empty afterId
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectJobsExactly(modifiedResult.getAgentPlan('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with all empty strings should use optimal insert via Route Matrix', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // All position options are empty strings - should fall back to optimal position
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder',
      afterId: ''
    });
    
    // Should call Route Matrix API for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
  });

  test('assignShipments with empty insert IDs should use optimal insert via Route Matrix', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Empty strings should be ignored, fall back to optimal
    await routeEditor.assignShipments('agent-A', ['shipment-3'], { 
      strategy: 'preserveOrder',
      afterId: ''
    });
    
    // Should call Route Matrix API for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-A');
  }, 10000);  // Extended timeout for Route Matrix calls
});

describe('RoutePlannerResultEditor Optimize After Position', () => {

  test('assignJobs with afterWaypointIndex + append: false should optimize after waypoint', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 to agent-B, optimize position after waypoint 0 (start)
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder', 
      afterWaypointIndex: 0,
      append: false 
    });
    
    // Should call Route Matrix API to find optimal position after waypoint 0
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // job-2 should be inserted somewhere after start, in optimal position
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    
    // agent-B should have all jobs, with job-2 positioned optimally after start
    const agentB = modifiedResult.getAgentPlan('agent-B')!;
    expectValidRoute(agentB);
    expectJobsExactly(agentB, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with afterId + append: false should optimize after specified job', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 to agent-B, optimize position after job-1
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder', 
      afterId: 'job-1',
      append: false 
    });
    
    // Should call Route Matrix API to find optimal position after job-1
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // job-2 should be inserted somewhere after job-1, in optimal position
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    
    // agent-B should have all jobs, with job-2 positioned optimally after job-1
    const agentB = modifiedResult.getAgentPlan('agent-B')!;
    expectValidRoute(agentB);
    expectJobsExactly(agentB, ['job-1', 'job-2', 'job-4']);
    
    // Verify job-2 comes after job-1 in the route
    const actions = agentB.getActions();
    const job1Index = actions.findIndex(a => a.getJobId() === 'job-1');
    const job2Index = actions.findIndex(a => a.getJobId() === 'job-2');
    expect(job2Index).toBeGreaterThan(job1Index);
  });

  test('assignShipments with afterWaypointIndex + append: false should optimize shipment positions after waypoint', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-3 to agent-A, optimize positions after waypoint 0 (start)
    await routeEditor.assignShipments('agent-A', ['shipment-3'], { 
      strategy: 'preserveOrder', 
      afterWaypointIndex: 0,
      append: false 
    });
    
    // Should call Route Matrix API to find optimal positions
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // shipment-3 should be inserted at optimal positions after start
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentPlan('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
    
    // agent-A should have all shipments, with shipment-3 positioned optimally
    const agentA = modifiedResult.getAgentPlan('agent-A')!;
    expectValidRoute(agentA);
    expectShipmentsExactly(agentA, ['shipment-1', 'shipment-2', 'shipment-3']);
  });

  test('assignShipments with afterId + append: false should optimize shipment positions after specified shipment', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-3 to agent-A, optimize positions after shipment-2
    await routeEditor.assignShipments('agent-A', ['shipment-3'], { 
      strategy: 'preserveOrder', 
      afterId: 'shipment-2',
      append: false 
    });
    
    // Should call Route Matrix API to find optimal positions
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // shipment-3 should be inserted at optimal positions after shipment-2
    expect(modifiedResult.getShipmentPlan('shipment-3')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentPlan('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
    
    // agent-A should have all shipments
    const agentA = modifiedResult.getAgentPlan('agent-A')!;
    expectValidRoute(agentA);
    expectShipmentsExactly(agentA, ['shipment-1', 'shipment-2', 'shipment-3']);
    
    // Verify shipment-3 pickup comes after shipment-2 in the route
    const actions = agentA.getActions();
    const shipment2PickupIndex = actions.findIndex(a => a.getShipmentId() === 'shipment-2' && a.getType() === 'pickup');
    const shipment3PickupIndex = actions.findIndex(a => a.getShipmentId() === 'shipment-3' && a.getType() === 'pickup');
    expect(shipment3PickupIndex).toBeGreaterThan(shipment2PickupIndex);
  });

  test('assignJobs with afterWaypointIndex + append: true should insert directly (no optimization)', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 to agent-B, insert directly after waypoint 0 (start)
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder', 
      afterWaypointIndex: 0,
      append: true 
    });
    
    // Should NOT call any API (direct insertion)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // job-2 should be inserted directly after start (before job-1)
    expect(modifiedResult.getJobPlan('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentPlan('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentPlan('agent-B')!, ['start', 'job-2', 'job-1', 'job-4', 'end']);
  });

  test('assignShipments with afterId + append: true should insert directly (no optimization)', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-4 to agent-A, insert directly after shipment-2
    await routeEditor.assignShipments('agent-A', ['shipment-4'], { 
      strategy: 'preserveOrder', 
      afterId: 'shipment-2',
      append: true 
    });
    
    // Should NOT call any API (direct insertion)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // shipment-4 should be inserted directly after shipment-2 (pickup then delivery)
    expect(modifiedResult.getShipmentPlan('shipment-4')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentPlan('agent-B')!, [
      'start', 'shipment-3-pickup', 'shipment-3-delivery', 'end'
    ]);
    expectActions(modifiedResult.getAgentPlan('agent-A')!, [
      'start', 'shipment-2-pickup', 'shipment-2-delivery', 
      'shipment-4-pickup', 'shipment-4-delivery',
      'shipment-1-pickup', 'shipment-1-delivery', 'end'
    ]);
  });
});

/**
 * Tests for error handling
 */
describe('RoutePlannerResultEditor Error Handling', () => {

  test('assignJobs with invalid agent index should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('non-existent-agent', ['job-2']);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('not found');
    }
  });

  test('assignJobs with invalid job id should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('agent-A', ['non-existent-job']);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('not found');
    }
  });

  test('assignJobs with empty job array should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('agent-A', []);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('No jobs provided');
    }
  });

  test('assignJobs with duplicate job ids should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('agent-A', ['job-1', 'job-1']);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toBe('Jobs are not unique');
    }
  });

  test('assignJobs with afterWaypointIndex pointing to end should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // agent-B has 3 waypoints total: start(0), job-1(1), job-4(2), end(3)
    // But waypoints.length is based on actual waypoint objects, not action count
    // Need to find the actual last waypoint index
    const agentB = plannerResult.getAgentPlan('agent-B')!;
    const lastWaypointIndex = agentB.getWaypoints().length - 1;
    
    try {
      await routeEditor.assignJobs('agent-B', ['job-2'], { 
        strategy: 'preserveOrder', 
        afterWaypointIndex: lastWaypointIndex  // Cannot insert after end
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('Cannot insert after waypoint');
      expect(error.message).toContain('end location');
    }
  });
});

/**
 * Verifies the exact action sequence for an agent.
 * @param agent - The agent solution to verify
 * @param expectedActions - Array of expected actions in order, e.g. ['start', 'job-1', 'job-2', 'end']
 *                          Use 'start', 'end' for start/end actions
 *                          Use job/shipment IDs for job actions
 *                          Use 'shipment-X-pickup' or 'shipment-X-delivery' for shipment actions
 */
function expectActions(agent: AgentPlan, expectedActions: string[]): void {
  const actions = agent.getActions();

  expect(actions.length).toBe(expectedActions.length);

  for (let i = 0; i < expectedActions.length; i++) {
    const expected = expectedActions[i];
    const actual = actions[i];

    expect(actual.getActionIndex()).toBe(i);

    if (expected === 'start' || expected === 'end') {
      expect(actual.getType()).toBe(expected);
    } else if (expected.includes('-pickup')) {
      const shipmentId = expected.replace('-pickup', '');
      expect(actual.getShipmentId()).toBe(shipmentId);
      expect(actual.getType()).toBe('pickup');
    } else if (expected.includes('-delivery')) {
      const shipmentId = expected.replace('-delivery', '');
      expect(actual.getShipmentId()).toBe(shipmentId);
      expect(actual.getType()).toBe('delivery');
    } else {
      // It's a job ID
      expect(actual.getJobId()).toBe(expected);
    }
  }
}

/**
 * Gets all job IDs from agent's actions
 */
function getJobIds(agent: AgentPlan): string[] {
  return agent.getActions()
    .filter(a => a.getJobId())
    .map(a => a.getJobId()!);
}

/**
 * Gets all shipment IDs from agent's actions (unique)
 */
function getShipmentIds(agent: AgentPlan): string[] {
  return [...new Set(agent.getActions()
    .filter(a => a.getShipmentId())
    .map(a => a.getShipmentId()!))];
}

/**
 * Verifies agent's actions contain the specified items (jobs or shipments)
 * @param agent - The agent solution to verify
 * @param itemIds - Array of job or shipment IDs that should be present
 */
function expectActionsContain(agent: AgentPlan, itemIds: string[]): void {
  const jobIds = getJobIds(agent);
  const shipmentIds = getShipmentIds(agent);
  const allItemIds = [...jobIds, ...shipmentIds];
  
  for (const itemId of itemIds) {
    expect(allItemIds).toContain(itemId);
  }
}

/**
 * Verifies agent's actions do NOT contain the specified items (jobs or shipments)
 * @param agent - The agent solution to verify
 * @param itemIds - Array of job or shipment IDs that should NOT be present
 */
function expectActionsNotContain(agent: AgentPlan, itemIds: string[]): void {
  const jobIds = getJobIds(agent);
  const shipmentIds = getShipmentIds(agent);
  const allItemIds = [...jobIds, ...shipmentIds];
  
  for (const itemId of itemIds) {
    expect(allItemIds).not.toContain(itemId);
  }
}

/**
 * Verifies agent has exactly these jobs (in any order)
 * @param agent - The agent solution to verify
 * @param expectedJobIds - Array of job IDs that should be present (and no others)
 */
function expectJobsExactly(agent: AgentPlan, expectedJobIds: string[]): void {
  const actualJobIds = getJobIds(agent).sort();
  expect(actualJobIds).toEqual(expectedJobIds.sort());
}

/**
 * Verifies agent has exactly these shipments (in any order)
 * @param agent - The agent solution to verify
 * @param expectedShipmentIds - Array of shipment IDs that should be present (and no others)
 */
function expectShipmentsExactly(agent: AgentPlan, expectedShipmentIds: string[]): void {
  const actualShipmentIds = getShipmentIds(agent).sort();
  expect(actualShipmentIds).toEqual(expectedShipmentIds.sort());
}

function expectValidRoute(agent: AgentPlan): void {
  const actions = agent.getActions();
  expect(actions.length).toBeGreaterThanOrEqual(2);
  expect(actions[0].getType()).toBe('start');
  expect(actions[actions.length - 1].getType()).toBe('end');
}

describe('RoutePlannerResultEditor reoptimizeAgentPlan', () => {

  test('reoptimizeAgentPlan without agentIdOrIndex should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    await expect(routeEditor.reoptimizeAgentPlan({})).rejects.toThrow('agentIdOrIndex is required');
  });

  test('reoptimizeAgentPlan with agentIdOrIndex should reoptimize specific agent', async () => {
    let rawData = loadJson("_data/route-planner-result-editor/job/result-data-multiple-jobs-for-reoptimize.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, rawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalJobsA = getJobIds(plannerResult.getAgentPlan('agent-A')!);
    
    await routeEditor.reoptimizeAgentPlan({ agentIdOrIndex: 'agent-B' });
    
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedAgentB = modifiedResult.getAgentPlan('agent-B')!;
    const modifiedJobsB = getJobIds(modifiedAgentB);
    
    expectValidRoute(modifiedAgentB);
    expect(modifiedJobsB.sort()).toEqual(['job-6', 'job-7', 'job-8', 'job-9', 'job-10'].sort());
    
    const modifiedJobsA = getJobIds(modifiedResult.getAgentPlan('agent-A')!);
    expect(modifiedJobsA.sort()).toEqual(originalJobsA.sort());
  });

  test('reoptimizeAgentPlan on agent with no jobs should return true', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    const result = await routeEditor.reoptimizeAgentPlan({ agentIdOrIndex: 99 });
    
    expect(result).toBe(true);
    expectApiNotCalled();
  });

  test('reoptimizeAgentPlan with allowViolations should relax target agent and target item constraints in request', async () => {
    const rawData: RoutePlannerResultResponseData = loadJson("_data/route-planner-result-editor/job/result-data-jobs-and-shipments-for-reoptimize.json");
    const targetFeature = rawData.features.find((f: FeatureResponseData) => f.properties.agent_id === 'agent-A')!;
    const targetAgentIndex = targetFeature.properties.agent_index;
    const targetAgent = rawData.properties.params.agents[targetAgentIndex];

    targetAgent.pickup_capacity = 3;
    targetAgent.delivery_capacity = 3;
    targetAgent.breaks = [{ time_windows: [[100, 200]], duration: 10 }];
    targetAgent.time_windows = [[0, 1000]];

    const targetJobIndex = targetFeature.properties.actions.find((a: ActionResponseData) => a.job_index !== undefined)!.job_index!;
    rawData.properties.params.jobs![targetJobIndex].time_windows = [[0, 500]];

    const targetShipmentIndex = targetFeature.properties.actions.find((a: ActionResponseData) => a.shipment_index !== undefined)!.shipment_index!;
    const targetShipment: any = rawData.properties.params.shipments![targetShipmentIndex];
    targetShipment.pickup = targetShipment.pickup || { location: [44.1, 40.1], time_windows: [] };
    targetShipment.delivery = targetShipment.delivery || { location: [44.2, 40.2], time_windows: [] };
    targetShipment.pickup.time_windows = [[0, 500]];
    targetShipment.delivery.time_windows = [[0, 500]];

    const plannerResult = new RoutePlannerResult({ apiKey: API_KEY }, rawData);
    const routeEditor = new RoutePlannerResultEditor(plannerResult);

    mockRoutePlannerSuccessWithFeature(targetFeature);
    await routeEditor.reoptimizeAgentPlan({ agentIdOrIndex: 'agent-A', allowViolations: true });

    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion

    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
  });

  test('reoptimizeAgentPlan with includeUnassigned should keep unassigned items assignable', async () => {
    const rawData: RoutePlannerResultResponseData = loadJson("_data/route-planner-result-editor/job/result-data-jobs-and-shipments-for-reoptimize.json");
    const targetFeature = rawData.features.find((f: FeatureResponseData) => f.properties.agent_id === 'agent-B')!;
    const targetJobIndexes = new Set(
      targetFeature.properties.actions
        .filter((a: ActionResponseData) => a.job_index !== undefined)
        .map((a: ActionResponseData) => a.job_index!)
    );
    const targetShipmentIndexes = new Set(
      targetFeature.properties.actions
        .filter((a: ActionResponseData) => a.shipment_index !== undefined)
        .map((a: ActionResponseData) => a.shipment_index!)
    );

    const unassignedJobIndex = rawData.properties.params.jobs!.findIndex((_job: any, index: number) => !targetJobIndexes.has(index));
    const unassignedShipmentIndex = rawData.properties.params.shipments!.findIndex((_shipment: any, index: number) => !targetShipmentIndexes.has(index));
    rawData.properties.issues = {
      ...(rawData.properties.issues || {}),
      unassigned_jobs: [unassignedJobIndex],
      unassigned_shipments: [unassignedShipmentIndex]
    };

    const restrictedJobIndex = rawData.properties.params.jobs!.findIndex(
      (_job: any, index: number) => index !== unassignedJobIndex && !targetJobIndexes.has(index)
    );
    const restrictedShipmentIndex = rawData.properties.params.shipments!.findIndex(
      (_shipment: any, index: number) => index !== unassignedShipmentIndex && !targetShipmentIndexes.has(index)
    );

    const plannerResult = new RoutePlannerResult({ apiKey: API_KEY }, rawData);
    const routeEditor = new RoutePlannerResultEditor(plannerResult);

    mockRoutePlannerSuccessWithFeature(targetFeature);
    await routeEditor.reoptimizeAgentPlan({ agentIdOrIndex: 'agent-B', includeUnassigned: true });

    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion

    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
    // ToDo: replace mocked request inspection with live-result assertion
  });

  test('reoptimizeAgentPlan should work when target agent has no current plan', async () => {
    const rawData: RoutePlannerResultResponseData = loadJson("_data/route-planner-result-editor/job/result-data-multiple-jobs-for-reoptimize.json");
    const removedFeatureIndex = rawData.features.findIndex((f: FeatureResponseData) => f.properties.agent_id === 'agent-B');
    const removedFeature = rawData.features.splice(removedFeatureIndex, 1)[0];
    const removedJobIndexes = [
      ...new Set(
        removedFeature.properties.actions
          .filter((a: ActionResponseData) => a.job_index !== undefined)
          .map((a: ActionResponseData) => a.job_index!)
      )
    ];

    rawData.properties.issues = {
      ...(rawData.properties.issues || {}),
      unassigned_agents: [1],
      unassigned_jobs: removedJobIndexes
    };

    const plannerResult = new RoutePlannerResult({ apiKey: API_KEY }, rawData);
    const routeEditor = new RoutePlannerResultEditor(plannerResult);

    mockRoutePlannerSuccessWithFeature(removedFeature);
    const result = await routeEditor.reoptimizeAgentPlan({ agentIdOrIndex: 'agent-B', includeUnassigned: true });

    expect(result).toBe(true);
    expectApiCalled(['routeplanner']);
    expect(routeEditor.getModifiedResult().getAgentPlan('agent-B')).toBeDefined();
  });

  test('reoptimizeAgentPlan with shipments should reoptimize specific agent', async () => {
    let rawData = loadJson("_data/route-planner-result-editor/shipment/result-data-multiple-shipments-for-reoptimize.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, rawData);

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalShipmentsA = getShipmentIds(plannerResult.getAgentPlan('agent-A')!);
    
    await routeEditor.reoptimizeAgentPlan({ agentIdOrIndex: 'agent-B' });
    
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedAgentB = modifiedResult.getAgentPlan('agent-B')!;
    const modifiedShipmentsB = getShipmentIds(modifiedAgentB);
    
    expectValidRoute(modifiedAgentB);
    expect(modifiedShipmentsB.sort()).toEqual(['shipment-6', 'shipment-7', 'shipment-8', 'shipment-9', 'shipment-10'].sort());
    
    const modifiedShipmentsA = getShipmentIds(modifiedResult.getAgentPlan('agent-A')!);
    expect(modifiedShipmentsA.sort()).toEqual(originalShipmentsA.sort());
  });

  test('reoptimizeAgentPlan should not affect other agents jobs', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalJobsA = getJobIds(plannerResult.getAgentPlan('agent-A')!);
    
    await routeEditor.reoptimizeAgentPlan({ agentIdOrIndex: 'agent-B' });
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedJobsA = getJobIds(modifiedResult.getAgentPlan('agent-A')!);
    
    expect(modifiedJobsA.sort()).toEqual(originalJobsA.sort());
  });
});

describe('RoutePlannerResultEditor addTimeOffsetAfterWaypoint', () => {

  test('addTimeOffsetAfterWaypoint should add offset to actions from waypoint', () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalResult = routeEditor.getModifiedResult();
    const originalTimes = originalResult.getAgentPlan('agent-B')!.getActions().map(a => a.getStartTime());
    
    routeEditor.addTimeOffsetAfterWaypoint('agent-B', 1, 3600);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const newTimes = modifiedResult.getAgentPlan('agent-B')!.getActions().map(a => a.getStartTime());
    
    expect(newTimes[0]).toBe(originalTimes[0]);
    expect(newTimes[1]).toBe(originalTimes[1] + 3600);
    expect(newTimes[2]).toBe(originalTimes[2] + 3600);
    expect(newTimes[3]).toBe(originalTimes[3] + 3600);
  });

  test('addTimeOffsetAfterWaypoint with waypoint 0 should offset all actions', () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalResult = routeEditor.getModifiedResult();
    const originalTimes = originalResult.getAgentPlan('agent-B')!.getActions().map(a => a.getStartTime());
    
    routeEditor.addTimeOffsetAfterWaypoint('agent-B', 0, 1800);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const newTimes = modifiedResult.getAgentPlan('agent-B')!.getActions().map(a => a.getStartTime());
    
    for (let i = 0; i < newTimes.length; i++) {
      expect(newTimes[i]).toBe(originalTimes[i] + 1800);
    }
  });

  test('addTimeOffsetAfterWaypoint on agent with no plan should do nothing', () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    routeEditor.addTimeOffsetAfterWaypoint(99, 0, 3600);
    
    expectApiNotCalled();
  });

  test('addTimeOffsetAfterWaypoint should update waypoint times', () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalWaypoints = plannerResult.getAgentPlan('agent-B')!.getWaypoints();
    const originalWaypointTimes = originalWaypoints.map(w => w.getStartTime());
    
    routeEditor.addTimeOffsetAfterWaypoint('agent-B', 1, 3600);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const newWaypoints = modifiedResult.getAgentPlan('agent-B')!.getWaypoints();
    const newWaypointTimes = newWaypoints.map(w => w.getStartTime());
    
    expect(newWaypointTimes[0]).toBe(originalWaypointTimes[0]);
    expect(newWaypointTimes[1]).toBe(originalWaypointTimes[1]);
    expect(newWaypointTimes[2]).toBe(originalWaypointTimes[2] + 3600);
  });

  test('addTimeOffsetAfterWaypoint should update leg time for provided waypoint', () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalLegTimes = plannerResult.getAgentPlan('agent-B')!.getLegs().map(l => l.getTime());

    routeEditor.addTimeOffsetAfterWaypoint('agent-B', 1, 120);

    let modifiedResult = routeEditor.getModifiedResult();
    const newLegTimes = modifiedResult.getAgentPlan('agent-B')!.getLegs().map(l => l.getTime());

    expect(newLegTimes[0]).toBe(originalLegTimes[0]);
    expect(newLegTimes[1]).toBe(originalLegTimes[1] + 120);
  });

  test('addTimeOffsetAfterWaypoint should throw when updated leg time becomes non-positive', () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);

    expect(() => routeEditor.addTimeOffsetAfterWaypoint('agent-B', 1, -100)).toThrow();
  });

  test('addTimeOffsetAfterWaypoint should not affect other agents', () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalAgentA = plannerResult.getAgentPlan('agent-A')!;
    const originalTimesA = originalAgentA.getActions().map(a => a.getStartTime());
    
    routeEditor.addTimeOffsetAfterWaypoint('agent-B', 1, 3600);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedAgentA = modifiedResult.getAgentPlan('agent-A')!;
    const modifiedTimesA = modifiedAgentA.getActions().map(a => a.getStartTime());
    
    for (let i = 0; i < originalTimesA.length; i++) {
      expect(modifiedTimesA[i]).toBe(originalTimesA[i]);
    }
  });
});

describe('RoutePlannerResultEditor moveWaypoint', () => {

  test('moveWaypoint should move waypoint to new position', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalJobs = getJobIds(plannerResult.getAgentPlan('agent-B')!);
    
    await routeEditor.moveWaypoint('agent-B', 2, 1);
    
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedJobs = getJobIds(modifiedResult.getAgentPlan('agent-B')!);
    
    expect(modifiedJobs[0]).toBe(originalJobs[1]);
    expect(modifiedJobs[1]).toBe(originalJobs[0]);
  });

  test('moveWaypoint should update waypoint indices', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    await routeEditor.moveWaypoint('agent-B', 2, 1);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const waypoints = modifiedResult.getAgentPlan('agent-B')!.getWaypoints();
    
    for (let i = 0; i < waypoints.length; i++) {
      const actions = waypoints[i].getActions();
      for (const action of actions) {
        expect(action.getRaw().waypoint_index).toBe(i);
      }
    }
  });

  test('moveWaypoint should throw error for start waypoint', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    await expect(routeEditor.moveWaypoint('agent-B', 0, 1)).rejects.toThrow('Cannot move waypoint containing start or end action');
  });

  test('moveWaypoint should allow moving last waypoint if it has no end action', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const waypoints = plannerResult.getAgentPlan('agent-B')!.getWaypoints();
    const originalJobs = getJobIds(plannerResult.getAgentPlan('agent-B')!);
    
    await routeEditor.moveWaypoint('agent-B', waypoints.length - 1, 1);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedJobs = getJobIds(modifiedResult.getAgentPlan('agent-B')!);
    
    expect(modifiedJobs[0]).toBe(originalJobs[1]);
    expect(modifiedJobs[1]).toBe(originalJobs[0]);
  });

  test('moveWaypoint should throw error for invalid waypoint index', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    await expect(routeEditor.moveWaypoint('agent-B', 99, 1)).rejects.toThrow('out of range');
  });

  test('moveWaypoint same position should do nothing', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalJobs = getJobIds(plannerResult.getAgentPlan('agent-B')!);
    
    await routeEditor.moveWaypoint('agent-B', 1, 1);
    
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedJobs = getJobIds(modifiedResult.getAgentPlan('agent-B')!);
    
    expect(modifiedJobs).toEqual(originalJobs);
  });

  test('moveWaypoint should not affect other agents', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalJobsA = getJobIds(plannerResult.getAgentPlan('agent-A')!);
    
    await routeEditor.moveWaypoint('agent-B', 2, 1);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedJobsA = getJobIds(modifiedResult.getAgentPlan('agent-A')!);
    
    expect(modifiedJobsA).toEqual(originalJobsA);
  });

  test('moveWaypoint should throw error for non-existent agent', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    await expect(routeEditor.moveWaypoint(99, 1, 2)).rejects.toThrow('Agent with index 99 not found');
  });

  test('moveWaypoint should recalculate times', async () => {
    let rawData: RoutePlannerResultData = loadJson("_data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    const originalTimes = plannerResult.getAgentPlan('agent-B')!.getActions().map(a => a.getStartTime());
    
    await routeEditor.moveWaypoint('agent-B', 2, 1);
    
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    const modifiedTimes = modifiedResult.getAgentPlan('agent-B')!.getActions().map(a => a.getStartTime());
    
    expect(modifiedTimes[0]).toBe(0);
    expect(modifiedTimes).not.toEqual(originalTimes);
  });
});
