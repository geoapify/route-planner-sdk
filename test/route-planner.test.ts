import RoutePlanner, {
  Agent, Avoid, Break,
  Job,
  Location,
  Shipment,
  ShipmentStep,
  RoutePlannerError,
  RoutePlannerInputData, RouteLeg, RouteAction, Waypoint, RoutePlannerResultEditor, RouteActionInfo
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

    planner.addAgent(new Agent().setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));
    planner.addAgent(new Agent().setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));
    planner.addAgent(new Agent().setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));

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
    expect(result.getAgentSolutions().length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.getAgentSolutions()[0].getLegs()![0]);
    testAllActionFieldsArePopulated(result.getAgentSolutions()[0].getActions()[1]);
    testAllWaypointFieldsArePopulated(result.getAgentWaypoints(result.getAgentSolutions()[0].getAgentId())[1]);
    testGetAgentShipments(result);
    testGetShipmentInfo(result);
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
    expect(result.getAgentSolutions().length).toBe(1);
    expect(result.getUnassignedAgents().length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.getAgentSolutions()[0].getLegs()![0]);
    testAllActionFieldsArePopulated(result.getAgentSolutions()[0].getActions()[2]);
    testAllWaypointFieldsArePopulated(result.getAgentSolutions()[0].getWaypoints()[1]);
    testGetAgentJobs(result);
    testGetJobInfo(result);
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
    expect(result.getAgentSolutions().length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.getAgentSolutions()[0].getLegs()![0]);
    testAllActionFieldsArePopulated(result.getAgentSolutions()[0].getActions()[2]);
    testAllWaypointFieldsArePopulated(result.getAgentSolutions()[0].getWaypoints()[1]);
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
    expect(result.getAgentSolutions().length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getUnassignedShipments().length).toBe(1);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.getAgentSolutions()[0].getLegs()![0]);
    testAllActionFieldsArePopulated(result.getAgentRouteActions(result.getData().agents[0].agentId)[1]);
    expect(result.getOptions()).toBeDefined();
  });

  test('should return success for complex test 5 - "Garbage collector truck routes"', async () => {
    const planner = new RoutePlanner({apiKey: API_KEY});

    planner.setMode("drive");

    planner.addAgent(new Agent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new Agent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new Agent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));

    planner.addJob(new Job().setDuration(300).setPickupAmount(60).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new Job().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.getAgentSolutions().length).toBe(1);
    expect(result.getUnassignedAgents().length).toBe(2);
    expect(result.getUnassignedJobs().length).toBe(1);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.getAgentRouteLegs(result.getData().agents[0].agentId)[0]);
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
    expect(result.getAgentSolutions().length).toBe(1);
    expect(result.getData().unassignedAgents.length).toBe(2);
    expect(result.getData().unassignedJobs.length).toBe(2);
    expect(result.getData().inputData).toBeDefined();
    testResponseParamsArePopulated(result, planner);
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.getAgentSolutions()[0].getLegs()![0]);
    expect(result.getAgentSolutions()[0].getActions()[2].getJobIndex()).toBeDefined()
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
    expect(firstWaypoint.getActions()[1].getIndex()).toBeDefined();
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
    expect(nextAction.getIndex()).toBeDefined();
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
    expect(result.getAgentSolutions()).toBeDefined();
    expect(result.getAgentSolutions()[0].getAgentIndex()).toBeDefined();
    expect(result.getAgentSolutions()[0].getTime()).toBeDefined();
    expect(result.getAgentSolutions()[0].getStartTime()).toBeDefined();
    expect(result.getAgentSolutions()[0].getEndTime()).toBeDefined();
    expect(result.getAgentSolutions()[0].getDistance()).toBeDefined();
  }

  function testGetAgentShipments(result: RoutePlannerResult) {
    let expectedResult = result.getData().agents[0].actions.filter(action => action.shipment_id !== undefined)
        .map(action => action.shipment_id);
    expect(result.getAgentShipments(result.getAgentSolutions()[0].getAgentId())).toStrictEqual(expectedResult);
  }

  function testGetAgentJobs(result: RoutePlannerResult) {
    let expectedResult = result.getData().agents[0].actions.filter(action => action.job_id !== undefined)
        .map(action => action.job_id);
    expect(result.getAgentJobs(result.getAgentSolutions()[0].getAgentId())).toStrictEqual(expectedResult);
  }

  function testGetShipmentInfo(result: RoutePlannerResult) {
    let agent = result.getAgentSolutions()[0];
    let expectedResult = {agentId: agent.getAgentId(), action: agent.getActions()[0], agent: agent};
    expect(result.getShipmentInfo(agent.getActions()[0].getShipmentId()!)).toStrictEqual(new RouteActionInfo(expectedResult));
  }

  function testGetJobInfo(result: RoutePlannerResult) {
    let agent = result.getAgentSolutions()[0];
    let expectedResult = {agentId: agent.getAgentId(), action: agent.getActions()[0], agent: agent};
    expect(result.getJobInfo(agent.getActions()[0].getJobId()!)).toStrictEqual(new RouteActionInfo(expectedResult));
  }

  function testResponseParamsArePopulated(result: RoutePlannerResult, planner: RoutePlanner) {
    expect(JSON.stringify(result.getData().inputData))
        .toBe(JSON.stringify(
            planner.getRaw()
        ));
  }
});
