import RoutePlanner, {
  Agent, Avoid, Break,
  Job,
  Location,
  Shipment,
  ShipmentStep,
  RoutePlannerError,
  RoutePlannerInputData, RouteLeg, RouteAction, Waypoint
} from "../src";
import { RoutePlannerResult } from "../src/models/entities/route-planner-result";
import TEST_API_KEY from "../env-variables";

const API_KEY = TEST_API_KEY;

describe('RoutePlanner', () => {
  test('should return success for basic request to Route Planner API', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    const result = await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
        .plan();

    expect(result).toBeDefined();
  });

  test('should return success for complex test 1 - "Simple delivery route planner"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent().setId('agent-A').setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));
    planner.addAgent(new Agent().setId('agent-B').setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));
    planner.addAgent(new Agent().setId('agent-C').setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));

    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new Shipment().setId("order-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)));

    planner.addShipment(new Shipment().setId("order-2")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.511160727462574, 40.1816037))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)));

    planner.addAvoid(new Avoid().setType("tolls"));
    planner.addAvoid(new Avoid().addValue(40.50485912329202, 42.177547000000004).setType("locations"));

    planner.setTraffic("approximated")
    planner.setType("short")
    planner.setUnits("metric");
    planner.setMaxSpeed(10)

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(getUsedAgents(result).length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(getUsedAgents(result)[0]!.getLegs()![0]);
    testAllActionFieldsArePopulated(getUsedAgents(result)[0]!.getActions()[1]);
    testAllWaypointFieldsArePopulated(getUsedAgents(result)[0]?.getWaypoints()[1]!);
    testGetPlannedShipments(result);
    testGetShipmentPlan(result);
    testGetShipmentSolutions(result);
    testGetShipmentSolution(result);
    expect(result.getJobPlans().length).toBe(0);
  });

  test('should return success for complex test 2 - "Deliver shipments and pickup returns"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800));

    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new Shipment().setId("order-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)));

    planner.addShipment(new Shipment().setId("order-2")
        .setDelivery(new ShipmentStep().setDuration(120).setLocationIndex(0))
        .setPickup(new ShipmentStep().setDuration(120).setLocation(44.505007387303756, 40.1877687)));


    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(getUsedAgents(result).length).toBe(1);
    expect(result.getUnassignedAgents().length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(getUsedAgents(result)[0]!.getLegs()![0]);
    testAllActionFieldsArePopulated(getUsedAgents(result)[0]!.getActions()[2]);
    testAllWaypointFieldsArePopulated(getUsedAgents(result)[0]!.getWaypoints()[1]);
    testGetPlannedJobs(result);
  });

  test('should return success for complex test 3 - "Pickup bulky items from different locations"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setDeliveryCapacity(3000));
    planner.addAgent(new Agent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800).setDeliveryCapacity(3000));
    planner.addAgent(new Agent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setDeliveryCapacity(3000));

    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new Shipment().setId("order-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)).setAmount(500));

    planner.addShipment(new Shipment().setId("order-2")
        .setDelivery(new ShipmentStep().setDuration(120).setLocationIndex(0))
        .setPickup(new ShipmentStep().setDuration(120).setLocation(44.505007387303756, 40.1877687)).setAmount(1000));


    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(getUsedAgents(result).length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(getUsedAgents(result)[0]!.getLegs()![0]);
    testAllActionFieldsArePopulated(getUsedAgents(result)[0]!.getActions()[2]);
    testAllWaypointFieldsArePopulated(getUsedAgents(result)[0]!.getWaypoints()[1]);
  });

  test('should return success for complex test 4 - "Delivery / pickup with constraints"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800)
        .addCapability("Extra-long").addCapability("Fragile").setId('agent-1'));
    planner.addAgent(new Agent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800).setId('agent-2'));
    planner.addAgent(new Agent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800)
        .addCapability("Extra-long").addCapability("Fragile").setId('agent-3'));

    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new Shipment().setId("order-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)).addRequirement('Extra-long').addRequirement('Fragile'));

    planner.addShipment(new Shipment().setId("order-2")
        .setDelivery(new ShipmentStep().setDuration(120).setLocationIndex(0))
        .setPickup(new ShipmentStep().setDuration(120).setLocation(44.505007387303756, 40.1877687)).addRequirement('Bad-requirement'));


    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(getUsedAgents(result).length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getUnassignedShipments().length).toBe(1);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(getUsedAgents(result)[0]!.getLegs()![0]);
    testAllActionFieldsArePopulated(result.getAgentPlan(result.getData().agents[0].agentId)!.getActions()[1]);
  });

  test('should return success for complex test 5 - "Garbage collector truck routes"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent().setId('agent-A').setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new Agent().setId('agent-B').setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setId('agent-C').setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));

    planner.addJob(new Job().setDuration(300).setId("1").setPickupAmount(60).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(200).setId("2").setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setId("3").setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setId("4").setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(getUsedAgents(result).length).toBe(1);
    expect(result.getUnassignedAgents().length).toBe(2);
    expect(result.getUnassignedJobs().length).toBe(1);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    const legs = result.getAgentPlan(result.getData().agents[0].agentId)?.getLegs();
    testAllLegFieldsArePopulated(legs?.[0]!);
    testGetJobPlan(result);
    testGetJobSolutions(result);
    testGetJobSolution(result);
    expect(result.getShipmentPlans().length).toBe(0);
  });

  test('should return success test all not used fields"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent().addTimeWindow(0, 10800).setStartLocationIndex(0).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new Agent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800).setEndLocationIndex(0).setDescription('My Vehicle').addBreak(new Break().setDuration(10).addTimeWindow(0, 10000)));
    planner.addAgent(new Agent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));

    planner.addLocation(new Location().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addJob(new Job().setDuration(300).setLocationIndex(0).setPriority(1).setDeliveryAmount(100).addRequirement('Bad-requirement'));
    planner.addJob(new Job().setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625).addTimeWindow(0, 100).setDescription('My job'));
    planner.addJob(new Job().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));

    planner.addShipment(new Shipment().setId("order-1")
        .setDelivery(new ShipmentStep().setDuration(120).setLocation(44.50932929564537, 40.18686625).addTimeWindow(0, 10))
        .setPickup(new ShipmentStep().setDuration(120).setLocationIndex(0)).setPriority(1).setDescription('Shipment'));

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(getUsedAgents(result).length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getData().unassignedJobs.length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(getUsedAgents(result)[0]!.getLegs()![0]);
    expect(getUsedAgents(result)[0]!.getActions()[2].getJobIndex()).toBeDefined()
  });


  test('should return issue object for invalid request to Route Planner API', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    try {
      await planner
          .setMode("drive")
          .plan();
      fail();
    } catch (error: any) {
      if (error instanceof RoutePlannerError) {
        expect(error).toBeDefined();
        expect(error.message).toBe("\"agents\" is required");
        expect(error.errorName).toBe("Bad Request");
      } else {
        throw error;  // Re-throw if it's not the expected error type
      }
    }
  });

  test('should create RoutePlannerData with rawData', async () => {
    const routePlannerData: RoutePlannerInputData = {
      mode: undefined,
      agents: [],
      jobs: [],
      shipments: [],
      locations: [],
      avoid: [],
      traffic: undefined,
      type: undefined,
      max_speed: 200,
      units: undefined,
    };
    const planner = new RoutePlanner({apiKey: API_KEY}, routePlannerData);

    expect(planner.getRaw()).toEqual(routePlannerData);
  });

  test('should create RoutePlannerData and set raw data', async () => {
    const routePlannerData: RoutePlannerInputData = {
      mode: undefined,
      agents: [],
      jobs: [],
      shipments: [],
      locations: [],
      avoid: [],
      traffic: undefined,
      type: undefined,
      max_speed: 200,
      units: undefined,
    };
    const planner = new RoutePlanner({apiKey: API_KEY});
    planner.setRaw(routePlannerData)

    expect(planner.getRaw()).toEqual(routePlannerData);
  });

  function testAllWaypointFieldsArePopulated(firstWaypoint: Waypoint) {
    expect(firstWaypoint.getOriginalLocation()).toBeDefined();
    expect(firstWaypoint.getLocation()).toBeDefined();
    expect(firstWaypoint.getStartTime()).toBeDefined();
    expect(firstWaypoint.getDuration()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getActionIndex()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getType()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getStartTime()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getDuration()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getShipmentIndex()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getShipmentId()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getLocationIndex()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getLocationId()).toBeDefined();
    expect(firstWaypoint.getActions()[1].getWaypointIndex()).toBeDefined();
    expect(firstWaypoint.getOriginalLocationIndex()).toBeDefined();
    expect(firstWaypoint.getOriginalLocationId()).toBeDefined();
    expect(firstWaypoint.getPrevLegIndex()).toBeDefined();
    expect(firstWaypoint.getNextLegIndex()).toBeDefined();
  }

  function testAllActionFieldsArePopulated(nextAction: RouteAction) {
    expect(nextAction.getActionIndex()).toBeDefined();
    expect(nextAction.getType()).toBeDefined();
    expect(nextAction.getStartTime()).toBeDefined();
    expect(nextAction.getDuration()).toBeDefined();
    expect(nextAction.getShipmentIndex()).toBeDefined();
    expect(nextAction.getShipmentId()).toBeDefined();
    expect(nextAction.getLocationIndex()).toBeDefined();
    expect(nextAction.getLocationId()).toBeDefined();
    expect(nextAction.getWaypointIndex()).toBeDefined();
  }

  function testAllLegFieldsArePopulated(firstLeg: RouteLeg) {
    expect(firstLeg.getTime()).toBeDefined();
    expect(firstLeg.getDistance()).toBeDefined();
    expect(firstLeg.getFromWaypointIndex()).toBeDefined();
    expect(firstLeg.getToWaypointIndex()).toBeDefined();
    expect(firstLeg.getSteps()[0].getFromIndex()).toBeDefined();
    expect(firstLeg.getSteps()[0].getToIndex()).toBeDefined();
    expect(firstLeg.getSteps()[0].getTime()).toBeDefined();
    expect(firstLeg.getSteps()[0].getDistance()).toBeDefined();
  }

  function testAllPrimitiveFeatureFieldsArePopulated(result: RoutePlannerResult) {
    let currentAgent = getUsedAgents(result)[0];
    expect(currentAgent).toBeDefined();
    expect(currentAgent!.getAgentIndex()).toBeDefined();
    expect(currentAgent!.getTime()).toBeDefined();
    expect(currentAgent!.getStartTime()).toBeDefined();
    expect(currentAgent!.getEndTime()).toBeDefined();
    expect(currentAgent!.getDistance()).toBeDefined();
  }

  function testGetPlannedShipments(result: RoutePlannerResult) {
    const agentPlan = getUsedAgents(result)[0];
    expect(agentPlan?.getPlannedShipments()).toEqual(expect.arrayContaining([0, 1]));
    expect(agentPlan?.getPlannedShipments().length).toBe(2);
  }

  function testGetPlannedJobs(result: RoutePlannerResult) {
    const usedAgent = getUsedAgents(result)[0]!;

    const expectedJobIndexes = result.getData().agents[0].actions
      .filter(action => action.job_index !== undefined)
      .map(action => action.job_index);

    const actualJobIndexes = usedAgent.getPlannedJobs();

    expect(actualJobIndexes).toEqual(expectedJobIndexes);
  }

  function testGetShipmentPlan(result: RoutePlannerResult) {
    let agent = getUsedAgents(result)[0];
    let shipmentPlan = result.getShipmentPlan(agent!.getActions()[1].getShipmentId()!);

    expect(shipmentPlan).toBeDefined();
    expect(shipmentPlan?.getAgentId()).toBe(agent!.getAgentId());
    expect(shipmentPlan?.getAgentPlan()).toBe(agent);

    const expectedActions = [agent!.getActions()[1], agent!.getActions()[4]];
    expect(shipmentPlan?.getRouteActions()).toEqual(expectedActions);
  }

  function testGetJobPlan(result: RoutePlannerResult) {
    let agent = getUsedAgents(result)[0];
    let jobPlan = result.getJobPlan(agent!.getActions()[1].getJobId()!);

    expect(jobPlan).toBeDefined();
    expect(jobPlan?.getAgentId()).toBe(agent!.getAgentId());
    expect(jobPlan?.getAgentPlan()).toBe(agent);

    const expectedActions = [agent!.getActions()[1]];
    expect(jobPlan?.getRouteActions()).toEqual(expectedActions);
  }

  function testResponseParamsArePopulated(result: RoutePlannerResult, planner: RoutePlanner) {
    expect(result.getData().inputData.mode).toBe(planner.getRaw().mode);
    expect(result.getData().inputData.type).toBe(planner.getRaw().type);
    expect(result.getData().inputData.traffic).toBe(planner.getRaw().traffic);
  }

  function testGetShipmentSolutions(result: RoutePlannerResult) {
    let shipmentSolutions = result.getShipmentPlans();
    expect(shipmentSolutions.length).toBe(2);
    expect(shipmentSolutions[0]!.getAgentId()).toBe('agent-A');
    expect(shipmentSolutions[0]!.getRouteActions().length).toBe(2);
    expect(shipmentSolutions[0]!.getAgentPlan()!.getAgentId()).toBe('agent-A');
    expect(shipmentSolutions[0]!.getShipmentId()).toBe('order-1');
  }

  function testGetJobSolutions(result: RoutePlannerResult) {
    let jobSolutions = result.getJobPlans();
    expect(jobSolutions.length).toBe(4);
    expect(jobSolutions[0].getAgentId()).toBe('agent-C');
    expect(jobSolutions[0].getRouteActions().length).toBe(1);
    expect(jobSolutions[0].getAgentId()).toBe('agent-C');
    expect(jobSolutions[0].getJobInputData().id).toBe('1');
  }

  function testGetShipmentSolution(result: RoutePlannerResult) {
    let shipmentSolution = result.getShipmentPlan('order-1');
    expect(shipmentSolution).toBeDefined();
    expect(shipmentSolution!.getAgentId()).toBe('agent-A');
    expect(shipmentSolution!.getRouteActions().length).toBe(2);
    expect(shipmentSolution!.getAgentPlan()!.getAgentId()).toBe('agent-A');
    expect(shipmentSolution!.getShipmentId()).toBe('order-1');

    expect(result.getShipmentPlan('unknown')?.getAgentId()).toBeUndefined()
  }

  function testGetJobSolution(result: RoutePlannerResult) {
    let jobSolution = result.getJobPlan('1');
    expect(jobSolution).toBeDefined();
    expect(jobSolution!.getAgentId()).toBe('agent-C');
    expect(jobSolution!.getRouteActions().length).toBe(1);
    expect(jobSolution!.getAgentId()).toBe('agent-C');
    expect(jobSolution!.getJobInputData().id).toBe('1');

    expect(result.getJobPlan('unknown')?.getAgentId()).toBeUndefined()
  }

  function getUsedAgents(result: RoutePlannerResult) {
    return result.getAgentPlans().filter(agent => agent);
  }
});
