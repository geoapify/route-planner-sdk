import {
  RoutePlannerResultEditor,
  RoutePlannerResultData, Job, Shipment, ShipmentStep, RoutePlanner
} from "../../src";
import { RoutePlannerResult } from "../../src/models/entities/route-planner-result";
import { AgentSolution } from "../../src/models/entities/nested/result/agent-solution";
import { loadJson } from "../utils.helper";
import TEST_API_KEY from "../../env-variables";
import {RoutePlannerResultReverseConverter} from "../route-planner-result-reverse-converter";
import * as fetchModule from "../../src/tools/fetch";

const API_KEY = TEST_API_KEY;

// Spy for tracking API calls
let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  fetchSpy = jest.spyOn(fetchModule, 'universalFetch');
});

afterEach(() => {
  fetchSpy.mockRestore();
});

/**
 * Verifies that ONLY the specified APIs were called (and no others)
 * @param apis - Array of API endpoints to check (e.g., ['routeplanner'], ['routematrix'], or both)
 */
function expectApiCalled(apis: string[]): void {
  // Verify each fetch call matches one of the expected APIs
  for (const call of fetchSpy.mock.calls) {
    const url = call[0];
    const matchesExpectedApi = apis.some(api => url.includes(`/v1/${api}`));
    if (!matchesExpectedApi) {
      fail(`Unexpected API call: ${url}. Expected only: ${apis.join(', ')}`);
    }
  }
}

/**
 * Verifies that NO APIs were called (neither Route Planner nor Route Matrix)
 */
function expectApiNotCalled(): void {
  expect(fetchSpy).not.toHaveBeenCalled();
}

/**
 * Tests for default behavior and reoptimize strategy
 */
describe('RoutePlannerResultEditor Default & Reoptimize Strategy', () => {

  test('assignJobs without options should use reoptimize (default)', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
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
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentSolution('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with explicit reoptimize strategy should call API with correct params', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with explicit reoptimize strategy
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'reoptimize' });
    
    // Verify API was called
    expectApiCalled(['routeplanner']);
    
    // Verify request body contains job-2 assigned to agent-B (index 1)
    const routePlannerCall = fetchSpy.mock.calls.find((call: any[]) => call[0].includes('/v1/routeplanner'));
    const requestBody = JSON.parse(routePlannerCall![1]!.body as string);
    const job2 = requestBody.jobs.find((j: any) => j.id === 'job-2');
    expect(job2.requirements).toContain('assign-agent-1'); // agent-B is index 1, with assign- prefix
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2) (job-2 removed)
    // agent-B: job-2 added (position optimized by API)
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentSolution('agent-B')!, ['job-1', 'job-2', 'job-4']);
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
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with priority as number (old API - backward compatible)
    await routeEditor.assignJobs('agent-B', ['job-2'], 100);
    
    // Verify API was called (uses reoptimize)
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2) (job-2 removed)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(?) → end(?) (job-2 added, position optimized by API)
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentSolution('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with priority in options (new API) should work', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with priority in options object (new API)
    await routeEditor.assignJobs('agent-B', ['job-2'], { priority: 100 });
    
    // Verify API was called (uses reoptimize by default)
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2) (job-2 removed)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(?) → end(?) (job-2 added, position optimized by API)
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectJobsExactly(modifiedResult.getAgentSolution('agent-B')!, ['job-1', 'job-2', 'job-4']);
  });

  test('assignShipments with priority as number (old API) should work', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-3 with priority as number (old API - backward compatible)
    await routeEditor.assignShipments('agent-A', ['shipment-3'], 100);
    
    // Verify API was called (uses reoptimize)
    expectApiCalled(['routeplanner']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: shipment-3-pickup and shipment-3-delivery added (position optimized by API)
    // agent-B: start(0) → shipment-4-pickup(1) → shipment-4-delivery(2) → end(3) (shipment-3 removed)
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-A');
    
    // Verify source agent - shipment-3 should be removed
    expectActionsNotContain(modifiedResult.getAgentSolution('agent-B')!, ['shipment-3']);
    expectActionsContain(modifiedResult.getAgentSolution('agent-B')!, ['shipment-4']);
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
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 with preserveOrder + appendToEnd (should NOT call API)
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called
    expectApiNotCalled();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(3) → end(4)
    let modifiedResult = routeEditor.getModifiedResult();
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-1', 'job-4', 'job-2', 'end']);
  });

  test('assignJobs with preserveOrder + appendToEnd should add job to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B with appendToEnd
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: start(0) → job-1(1) → job-4(2) → job-2(3) → end(4)
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-1', 'job-4', 'job-2', 'end']);
  });

  test('assignShipments with preserveOrder + appendToEnd should add shipment to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-3 from agent-B to agent-A with appendToEnd
    await routeEditor.assignShipments('agent-A', ['shipment-3'], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → shipment-3-pickup(5) → shipment-3-delivery(6) → end(7)
    // agent-B: start(0) → shipment-4-pickup(1) → shipment-4-delivery(2) → end(3)
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, [
      'start', 'shipment-2-pickup', 'shipment-2-delivery', 'shipment-1-pickup', 'shipment-1-delivery', 
      'shipment-3-pickup', 'shipment-3-delivery', 'end'
    ]);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
  });

  test('addNewJobs with preserveOrder + appendToEnd should add new job to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-assigned-agent.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newJob = new Job()
        .setLocation(44.50932929564537, 40.18686625)
        .setPickupAmount(10)
        .setId("job-5");
    
    await routeEditor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → job-2(2) → job-5(3) → end(4)
    expect(modifiedResult.getJobInfo('job-5')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'job-2', 'job-5', 'end']);
  });

  test('addNewShipments with preserveOrder + appendToEnd should add new shipment to end of route', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newShipment = new Shipment()
        .setId("shipment-5")
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(500))
        .setDelivery(new ShipmentStep().setLocation(44.51, 40.19).setDuration(500));
    
    await routeEditor.addNewShipments('agent-A', [newShipment], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → shipment-5-pickup(5) → shipment-5-delivery(6) → end(7)
    expect(modifiedResult.getShipmentInfo('shipment-5')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, [
      'start', 'shipment-2-pickup', 'shipment-2-delivery', 'shipment-1-pickup', 'shipment-1-delivery',
      'shipment-5-pickup', 'shipment-5-delivery', 'end'
    ]);
  });

  test('assignJobs with preserveOrder + appendToEnd to unassigned agent should create feature and append', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: UNASSIGNED
    // job-1: unassigned
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned job-1 to unassigned agent-B with appendToEnd strategy
    await routeEditor.assignJobs('agent-B', ['job-1'], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → job-1(1) → end(2) (created from scratch)
    expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-1', 'end']);
  });

  test('assignShipments with preserveOrder + appendToEnd to unassigned agent should create feature and append', async () => {
    // Initial state:
    // agent-A: has shipments 1 & 2
    // agent-B: UNASSIGNED
    // shipment-3: unassigned
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned shipment-3 to unassigned agent-B with appendToEnd strategy
    await routeEditor.assignShipments('agent-B', ['shipment-3'], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-3-delivery(2) → end(3) (created from scratch)
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'shipment-3-pickup', 'shipment-3-delivery', 'end']);
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
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
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
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    
    // Verify agent-B has all expected jobs (order determined by algorithm)
    const agentB = modifiedResult.getAgentSolution('agent-B')!;
    expectValidRoute(agentB);
    expect(agentB.getActions().length).toBe(5); // start, job-1, job-4, job-2, end
    expectJobsExactly(agentB, ['job-1', 'job-2', 'job-4']);
  });

  test('assignJobs with preserveOrder + afterWaypointIndex should place job at specific index', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B at index 0 (first job position, after start)
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: start(0) → job-2(1) → job-1(2) → job-4(3) → end(4)
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-2', 'job-1', 'job-4', 'end']);
  });

  test('assignJobs with preserveOrder + beforeId should place job before specified job', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B, before job-4
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', beforeId: 'job-4' });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: start(0) → job-1(1) → job-2(2) → job-4(3) → end(4)
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-1', 'job-2', 'job-4', 'end']);
  });

  test('assignJobs with preserveOrder + afterId should place job after specified job', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: start(0) → job-1(1) → job-4(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move job-2 from agent-A to agent-B, after job-1
    await routeEditor.assignJobs('agent-B', ['job-2'], { strategy: 'preserveOrder', afterId: 'job-1' });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-3(1) → end(2)
    // agent-B: start(0) → job-1(1) → job-2(2) → job-4(3) → end(4)
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-1', 'job-2', 'job-4', 'end']);
  });

  test('assignShipments with preserveOrder (no position) should find optimal position via Route Matrix', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
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
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentSolution('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
    
    // Verify agent-A has all expected shipments
    const agentA = modifiedResult.getAgentSolution('agent-A')!;
    expectValidRoute(agentA);
    expectActionsContain(agentA, ['shipment-1', 'shipment-2', 'shipment-3']);
  });

  test('assignShipments with preserveOrder + afterWaypointIndex should place shipment at specific index', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Move shipment-4 from agent-B to agent-A at beginning
    await routeEditor.assignShipments('agent-A', ['shipment-4'], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → shipment-4-pickup(1) → shipment-4-delivery(2) → shipment-2-pickup(3) → shipment-2-delivery(4) → shipment-1-pickup(5) → shipment-1-delivery(6) → end(7)
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-3-delivery(2) → end(3)
    expect(modifiedResult.getShipmentInfo('shipment-4')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'shipment-2-pickup', 'shipment-2-delivery', 
      'shipment-1-pickup', 'shipment-1-delivery', 'end'
    ]);
    expectActionsContain(modifiedResult.getAgentSolution('agent-B')!, ['shipment-3']);
    expectActionsNotContain(modifiedResult.getAgentSolution('agent-B')!, ['shipment-4']);
  });

  test('addNewJobs with preserveOrder + afterWaypointIndex should place job at specific index', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-assigned-agent.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newJob = new Job()
        .setLocation(44.50932929564537, 40.18686625)
        .setPickupAmount(10)
        .setId("job-5");
    
    await routeEditor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-5(1) → job-3(2) → job-2(3) → end(4)
    expect(modifiedResult.getJobInfo('job-5')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-5', 'job-3', 'job-2', 'end']);
  });

  test('addNewShipments with preserveOrder + afterWaypointIndex should place shipment at specific index', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    let newShipment = new Shipment()
        .setId("shipment-5")
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(500))
        .setDelivery(new ShipmentStep().setLocation(44.51, 40.19).setDuration(500));
    
    await routeEditor.addNewShipments('agent-A', [newShipment], { strategy: 'preserveOrder', afterWaypointIndex: 0 });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → shipment-5-pickup(1) → shipment-5-delivery(2) → shipment-2-pickup(3) → shipment-2-delivery(4) → shipment-1-pickup(5) → shipment-1-delivery(6) → end(7)
    expect(modifiedResult.getShipmentInfo('shipment-5')!.getAgentId()).toBe('agent-A');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, [
      'start', 'shipment-5-pickup', 'shipment-5-delivery', 'shipment-2-pickup', 'shipment-2-delivery',
      'shipment-1-pickup', 'shipment-1-delivery', 'end'
    ]);
  });

  test('addNewJobs with preserveOrder (no position) should insert at optimal position via Route Matrix', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-add-job-success-assigned-agent.json");
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
    expect(modifiedResult.getJobInfo('job-5')!.getAgentId()).toBe('agent-A');
    
    const agentA = modifiedResult.getAgentSolution('agent-A')!;
    expectValidRoute(agentA);
    expect(agentA.getActions().length).toBe(5); // start, job-3, job-2, job-5, end
    expectJobsExactly(agentA, ['job-2', 'job-3', 'job-5']);
  });

  test('addNewShipments with preserveOrder (no position) should insert at optimal position via Route Matrix', async () => {
    // Initial state:
    // agent-A: start(0) → shipment-2-pickup(1) → shipment-2-delivery(2) → shipment-1-pickup(3) → shipment-1-delivery(4) → end(5)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
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
    expect(modifiedResult.getShipmentInfo('shipment-5')!.getAgentId()).toBe('agent-A');
    
    const agentA = modifiedResult.getAgentSolution('agent-A')!;
    expectValidRoute(agentA);
    expectShipmentsExactly(agentA, ['shipment-1', 'shipment-2', 'shipment-5']);
  }, 15000); // Extended timeout for multiple Route Matrix API calls

  test('assignJobs with preserveOrder to unassigned agent should create feature and insert', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // agent-B: UNASSIGNED
    // job-1: unassigned
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned job-1 to unassigned agent-B with preserveOrder + appendToEnd
    // (Can't use waypoint indexes on agents without routes)
    await routeEditor.assignJobs('agent-B', ['job-1'], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → job-1(1) → end(2) (created from scratch)
    expect(modifiedResult.getJobInfo('job-1')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-1', 'end']);
  });

  test('assignShipments with preserveOrder to unassigned agent should create feature and insert', async () => {
    // Initial state:
    // agent-A: has shipments 1 & 2
    // agent-B: UNASSIGNED
    // shipment-3: unassigned
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-unassigned-agent-shipment-not-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Assign unassigned shipment-3 to unassigned agent-B with preserveOrder + appendToEnd
    // (No existing route, so just append)
    await routeEditor.assignShipments('agent-B', ['shipment-3'], { strategy: 'preserveOrder', appendToEnd: true });
    
    // Verify Route Matrix API was NOT called (no existing route to optimize insertion point for)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-3-delivery(2) → end(3) (created from scratch)
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-B');
    expect(modifiedResult.getUnassignedAgents().length).toBe(0);
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'shipment-3-pickup', 'shipment-3-delivery', 'end']);
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
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
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
    expect(modifiedResult.getJobInfo('job-2')).toBeUndefined();
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    expect(modifiedResult.getUnassignedJobs()[0].id).toBe('job-2');
    expectActionsContain(modifiedResult.getAgentSolution('agent-A')!, ['job-3']);
    expectActionsNotContain(modifiedResult.getAgentSolution('agent-A')!, ['job-2']);
  });

  test('removeShipments with explicit reoptimize strategy should call API', async () => {
    // Initial state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    // Unassigned shipments: []
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
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
    expect(modifiedResult.getShipmentInfo('shipment-3')).toBeUndefined();
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0].id).toBe('shipment-3');
    expectActionsContain(modifiedResult.getAgentSolution('agent-B')!, ['shipment-4']);
    expectActionsNotContain(modifiedResult.getAgentSolution('agent-B')!, ['shipment-3']);
  });

  test('removeJobs with preserveOrder should remove without reoptimizing', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    // Unassigned jobs: []
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
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
    expect(modifiedResult.getJobInfo('job-2')).toBeUndefined();
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    expect(modifiedResult.getUnassignedJobs()[0].id).toBe('job-2');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
  });

  test('removeShipments with preserveOrder should remove without reoptimizing', async () => {
    // Initial state:
    // agent-B: start(0) → shipment-3-pickup(1) → shipment-4-pickup(2) → shipment-3-delivery(3) → shipment-4-delivery(4) → end(5)
    // Unassigned shipments: []
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
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
    expect(modifiedResult.getShipmentInfo('shipment-3')).toBeUndefined();
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0].id).toBe('shipment-3');
    expectActions(modifiedResult.getAgentSolution('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
  });

  test('removeJobs with preserveOrder should keep remaining jobs in same order', async () => {
    // Initial state:
    // agent-A: start(0) → job-3(1) → job-2(2) → end(3)
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove job-3 (first job on agent-A)
    await routeEditor.removeJobs(['job-3'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called (local manipulation)
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state:
    // agent-A: start(0) → job-2(1) → end(2)
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-2', 'end']);
  });

  test('removeJobs with preserveOrder should handle missing issues object', async () => {
    // Initial state with NO issues object in raw data
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));
    
    // Manually remove issues object to simulate the bug scenario
    delete plannerResult.getRawData().properties.issues;

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove job-2 - should not crash even without issues object
    await routeEditor.removeJobs(['job-2'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state: job removed and added to newly created unassigned_jobs array
    expect(modifiedResult.getJobInfo('job-2')).toBeUndefined();
    expect(modifiedResult.getUnassignedJobs().length).toBe(1);
    expect(modifiedResult.getUnassignedJobs()[0].id).toBe('job-2');
    expectActions(modifiedResult.getAgentSolution('agent-A')!, ['start', 'job-3', 'end']);
  });

  test('removeShipments with preserveOrder should handle missing issues object', async () => {
    // Initial state with NO issues object in raw data
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));
    
    // Manually remove issues object to simulate the bug scenario
    delete plannerResult.getRawData().properties.issues;

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Remove shipment-3 - should not crash even without issues object
    await routeEditor.removeShipments(['shipment-3'], { strategy: 'preserveOrder' });
    
    // Verify Route Planner API was NOT called
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Expected state: shipment removed and added to newly created unassigned_shipments array
    expect(modifiedResult.getShipmentInfo('shipment-3')).toBeUndefined();
    expect(modifiedResult.getUnassignedShipments().length).toBe(1);
    expect(modifiedResult.getUnassignedShipments()[0].id).toBe('shipment-3');
    expectActions(modifiedResult.getAgentSolution('agent-B')!, [
      'start', 'shipment-4-pickup', 'shipment-4-delivery', 'end'
    ]);
  });
});

/**
 * Tests for empty string handling in preserveOrder options
 */
describe('RoutePlannerResultEditor Empty String Handling', () => {

  test('assignJobs with empty afterId should use afterWaypointIndex instead', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Pass empty string for afterId and valid afterWaypointIndex
    // afterWaypointIndex: 0 means after waypoint 0 (start), so first position
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder', 
      afterId: '',  // Empty string - should be ignored
      afterWaypointIndex: 0 
    });
    
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Should insert after waypoint 0 (start), ignoring empty afterId
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-2', 'job-1', 'job-4', 'end']);
  });

  test('assignJobs with empty beforeId should use afterWaypointIndex instead', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Pass empty string for beforeId and valid afterWaypointIndex
    // afterWaypointIndex: 1 means after waypoint 1 (first job)
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder', 
      beforeId: '',  // Empty string - should be ignored
      afterWaypointIndex: 1 
    });
    
    expectApiNotCalled();
    
    let modifiedResult = routeEditor.getModifiedResult();
    
    // Should insert after waypoint 1 (job-1), ignoring empty beforeId
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
    expectActions(modifiedResult.getAgentSolution('agent-B')!, ['start', 'job-1', 'job-2', 'job-4', 'end']);
  });

  test('assignJobs with all empty strings should use optimal insert via Route Matrix', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // All position options are empty strings - should fall back to optimal position
    await routeEditor.assignJobs('agent-B', ['job-2'], { 
      strategy: 'preserveOrder',
      beforeId: '',
      afterId: ''
    });
    
    // Should call Route Matrix API for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    expect(modifiedResult.getJobInfo('job-2')!.getAgentId()).toBe('agent-B');
  });

  test('assignShipments with empty insert IDs should use optimal insert via Route Matrix', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/shipment/result-data-shipment-assigned-agent-shipment-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // Empty strings should be ignored, fall back to optimal
    await routeEditor.assignShipments('agent-A', ['shipment-3'], { 
      strategy: 'preserveOrder',
      beforeId: '',
      afterId: ''
    });
    
    // Should call Route Matrix API for optimal position
    expectApiCalled(['routematrix']);
    
    let modifiedResult = routeEditor.getModifiedResult();
    expect(modifiedResult.getShipmentInfo('shipment-3')!.getAgentId()).toBe('agent-A');
  }, 10000);  // Extended timeout for Route Matrix calls
});

/**
 * Tests for error handling
 */
describe('RoutePlannerResultEditor Error Handling', () => {

  test('assignJobs with invalid agent index should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
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
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('agent-A', ['non-existent-job']);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('not found');
    }
  });

  test('preserveOrder with invalid beforeId should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('agent-B', ['job-2'], { 
        strategy: 'preserveOrder', 
        beforeId: 'non-existent-job' 
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('not found');
    }
  });

  test('assignJobs with empty job array should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
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
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('agent-A', ['job-1', 'job-1']);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toBe('Jobs are not unique');
    }
  });

  test('assignJobs with beforeWaypointIndex=0 should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    try {
      await routeEditor.assignJobs('agent-B', ['job-2'], { 
        strategy: 'preserveOrder', 
        beforeWaypointIndex: 0  // Cannot insert before start
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('Cannot insert before waypoint 0');
    }
  });

  test('assignJobs with afterWaypointIndex pointing to end should throw error', async () => {
    let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
    let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, RoutePlannerResultReverseConverter.convert(rawData));

    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    
    // agent-B has 3 waypoints total: start(0), job-1(1), job-4(2), end(3)
    // But waypoints.length is based on actual waypoint objects, not action count
    // Need to find the actual last waypoint index
    const agentB = plannerResult.getAgentSolution('agent-B')!;
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
function expectActions(agent: AgentSolution, expectedActions: string[]): void {
  const actions = agent.getActions();

  expect(actions.length).toBe(expectedActions.length);

  for (let i = 0; i < expectedActions.length; i++) {
    const expected = expectedActions[i];
    const actual = actions[i];

    expect(actual.getIndex()).toBe(i);

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
function getJobIds(agent: AgentSolution): string[] {
  return agent.getActions()
    .filter(a => a.getJobId())
    .map(a => a.getJobId()!);
}

/**
 * Gets all shipment IDs from agent's actions (unique)
 */
function getShipmentIds(agent: AgentSolution): string[] {
  return [...new Set(agent.getActions()
    .filter(a => a.getShipmentId())
    .map(a => a.getShipmentId()!))];
}

/**
 * Verifies agent's actions contain the specified items (jobs or shipments)
 * @param agent - The agent solution to verify
 * @param itemIds - Array of job or shipment IDs that should be present
 */
function expectActionsContain(agent: AgentSolution, itemIds: string[]): void {
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
function expectActionsNotContain(agent: AgentSolution, itemIds: string[]): void {
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
function expectJobsExactly(agent: AgentSolution, expectedJobIds: string[]): void {
  const actualJobIds = getJobIds(agent).sort();
  expect(actualJobIds).toEqual(expectedJobIds.sort());
}

/**
 * Verifies agent has exactly these shipments (in any order)
 * @param agent - The agent solution to verify
 * @param expectedShipmentIds - Array of shipment IDs that should be present (and no others)
 */
function expectShipmentsExactly(agent: AgentSolution, expectedShipmentIds: string[]): void {
  const actualShipmentIds = getShipmentIds(agent).sort();
  expect(actualShipmentIds).toEqual(expectedShipmentIds.sort());
}

/**
 * Verifies agent's route starts with 'start' and ends with 'end' actions
 * @param agent - The agent solution to verify
 */
function expectValidRoute(agent: AgentSolution): void {
  const actions = agent.getActions();
  expect(actions.length).toBeGreaterThanOrEqual(2);
  expect(actions[0].getType()).toBe('start');
  expect(actions[actions.length - 1].getType()).toBe('end');
}
