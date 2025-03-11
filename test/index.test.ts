import RoutePlanner, {
  RouteAgent, RouteAvoid, RouteBreak,
  RouteJob,
  RouteLocation, RoutePlannerResult,
  RouteShipment,
  RouteShipmentLocation, RPAction, RPLeg,
  RPWaypoint,
  RoutePlannerError
} from "../src";

const API_KEY = "TEST_API_KEY";

describe('RoutePlanner', () => {
  test('should return success for basic request to Route Planner API', async () => {
    const planner = new RoutePlanner(API_KEY);

    const result = await planner
        .setMode("drive")
        .addAgent(new RouteAgent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new RouteJob().setId("job-1").setLocation(13.39, 52.51))
        .plan();

    expect(result).toBeDefined();
  });

  test('should return success for complex test 1 - "Simple delivery route planner"', async () => {
    const planner = new RoutePlanner(API_KEY);

    planner.setMode("drive");

    planner.addAgent(new RouteAgent().setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));
    planner.addAgent(new RouteAgent().setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));
    planner.addAgent(new RouteAgent().setStartLocation(44.50485912329202, 40.177547000000004).addTimeWindow(0, 7200));

    planner.addLocation(new RouteLocation().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new RouteShipment().setId("order-1")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocationIndex(0)));

    planner.addShipment(new RouteShipment().setId("order-2")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocation(44.511160727462574, 40.1816037))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocationIndex(0)));

    planner.addAvoid(new RouteAvoid().setType("tolls"));
    planner.addAvoid(new RouteAvoid().addValue(40.50485912329202, 42.177547000000004).setType("locations"));

    planner.setTraffic("approximated")
    planner.setType("short")
    planner.setUnits("metric");
    planner.setMaxSpeed(10)

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.features.length).toBe(1);
    expect(result.properties.issues.unassigned_agents.length).toBe(2);
    expect(result.properties).toBeDefined();
    expect(JSON.stringify(result.properties.params))
        .toBe(JSON.stringify(
            {mode: 'drive', agents: planner.agents, shipments: planner.shipments, locations: planner.locations,
              avoid: planner.avoid, traffic: planner.traffic, type: planner.type, max_speed: planner.max_speed, units: planner.units}
        ));
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.features[0].properties.legs![0]);
    testAllActionFieldsArePopulated(result.features[0].properties.actions[1]);
    testAllWaypointFieldsArePopulated(result.features[0].properties.waypoints[1]);
  });

  test('should return success for complex test 2 - "Deliver shipments and pickup returns"', async () => {
    const planner = new RoutePlanner(API_KEY);

    planner.setMode("drive");

    planner.addAgent(new RouteAgent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new RouteAgent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new RouteAgent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800));

    planner.addLocation(new RouteLocation().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new RouteShipment().setId("order-1")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocationIndex(0)));

    planner.addShipment(new RouteShipment().setId("order-2")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocationIndex(0))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocation(44.505007387303756, 40.1877687)));


    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.features.length).toBe(1);
    expect(result.properties.issues.unassigned_agents.length).toBe(2);
    expect(result.properties).toBeDefined();
    expect(JSON.stringify(result.properties.params))
        .toBe(JSON.stringify(
            {mode: 'drive', agents: planner.agents, shipments: planner.shipments, locations: planner.locations}
        ));
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.features[0].properties.legs![0]);
    testAllActionFieldsArePopulated(result.features[0].properties.actions[2]);
    testAllWaypointFieldsArePopulated(result.features[0].properties.waypoints[1]);
  });

  test('should return success for complex test 3 - "Pickup bulky items from different locations"', async () => {
    const planner = new RoutePlanner(API_KEY);

    planner.setMode("drive");

    planner.addAgent(new RouteAgent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setDeliveryCapacity(3000));
    planner.addAgent(new RouteAgent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800).setDeliveryCapacity(3000));
    planner.addAgent(new RouteAgent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setDeliveryCapacity(3000));

    planner.addLocation(new RouteLocation().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new RouteShipment().setId("order-1")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocationIndex(0)).setAmount(500));

    planner.addShipment(new RouteShipment().setId("order-2")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocationIndex(0))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocation(44.505007387303756, 40.1877687)).setAmount(1000));


    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.features.length).toBe(1);
    expect(result.properties.issues.unassigned_agents.length).toBe(2);
    expect(result.properties).toBeDefined();
    expect(JSON.stringify(result.properties.params))
        .toBe(JSON.stringify(
            {mode: 'drive', agents: planner.agents, shipments: planner.shipments, locations: planner.locations}
        ));
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.features[0].properties.legs![0]);
    testAllActionFieldsArePopulated(result.features[0].properties.actions[2]);
    testAllWaypointFieldsArePopulated(result.features[0].properties.waypoints[1]);
  });

  test('should return success for complex test 4 - "Delivery / pickup with constraints"', async () => {
    const planner = new RoutePlanner(API_KEY);

    planner.setMode("drive");

    planner.addAgent(new RouteAgent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800)
        .addCapability("Extra-long").addCapability("Fragile"));
    planner.addAgent(new RouteAgent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new RouteAgent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800)
        .addCapability("Extra-long").addCapability("Fragile"));

    planner.addLocation(new RouteLocation().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addShipment(new RouteShipment().setId("order-1")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocation(44.50932929564537, 40.18686625))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocationIndex(0)).addRequirement('Extra-long').addRequirement('Fragile'));

    planner.addShipment(new RouteShipment().setId("order-2")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocationIndex(0))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocation(44.505007387303756, 40.1877687)).addRequirement('Bad-requirement'));


    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.features.length).toBe(1);
    expect(result.properties.issues.unassigned_agents.length).toBe(2);
    expect(result.properties.issues.unassigned_shipments.length).toBe(1);
    expect(result.properties).toBeDefined();
    expect(JSON.stringify(result.properties.params))
        .toBe(JSON.stringify(
            {mode: 'drive', agents: planner.agents, shipments: planner.shipments, locations: planner.locations}
        ));
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.features[0].properties.legs![0]);
    testAllActionFieldsArePopulated(result.features[0].properties.actions[1]);
  });

  test('should return success for complex test 5 - "Garbage collector truck routes"', async () => {
    const planner = new RoutePlanner(API_KEY);

    planner.setMode("drive");

    planner.addAgent(new RouteAgent().setStartLocation(44.52566026661482, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new RouteAgent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800));
    planner.addAgent(new RouteAgent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));

    planner.addJob(new RouteJob().setDuration(300).setPickupAmount(60).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new RouteJob().setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new RouteJob().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new RouteJob().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.features.length).toBe(1);
    expect(result.properties.issues.unassigned_agents.length).toBe(2);
    expect(result.properties.issues.unassigned_jobs.length).toBe(1);
    expect(result.properties).toBeDefined();
    expect(JSON.stringify(result.properties.params))
        .toBe(JSON.stringify(
            {mode: 'drive', agents: planner.agents, jobs: planner.jobs}
        ));
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.features[0].properties.legs![0]);
  });

  test('should return success test all not used fields"', async () => {
    const planner = new RoutePlanner(API_KEY);

    planner.setMode("drive");

    planner.addAgent(new RouteAgent().addTimeWindow(0, 10800).setStartLocationIndex(0).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));
    planner.addAgent(new RouteAgent().setStartLocation(44.52244306971864, 40.1877687).addTimeWindow(0, 10800).setEndLocationIndex(0).setDescription('My Vehicle').addBreak(new RouteBreak().setDuration(10).addTimeWindow(0, 10000)));
    planner.addAgent(new RouteAgent().setStartLocation(44.505007387303756, 40.1877687).addTimeWindow(0, 10800).setEndLocation(44.486653350000005, 40.18298485).setPickupCapacity(10000));

    planner.addLocation(new RouteLocation().setId("warehouse-0").setLocation(44.5130974, 40.1766863));

    planner.addJob(new RouteJob().setDuration(300).setLocationIndex(0).setPriority(1).setDeliveryAmount(100).addRequirement('Bad-requirement'));
    planner.addJob(new RouteJob().setDuration(200).setPickupAmount(20000).setLocation(44.50932929564537, 40.18686625).addTimeWindow(0, 100).setDescription('My job'));
    planner.addJob(new RouteJob().setDuration(300).setPickupAmount(10).setLocation(44.50932929564537, 40.18686625));
    planner.addJob(new RouteJob().setDuration(300).setPickupAmount(0).setLocation(44.50932929564537, 40.18686625));

    planner.addShipment(new RouteShipment().setId("order-1")
        .setDelivery(new RouteShipmentLocation().setDuration(120).setLocation(44.50932929564537, 40.18686625).addTimeWindow(0, 10))
        .setPickup(new RouteShipmentLocation().setDuration(120).setLocationIndex(0)).setPriority(1).setDescription('Shipment'));

    const result = await planner.plan();
    expect(result).toBeDefined();
    expect(result.features.length).toBe(1);
    expect(result.properties.issues.unassigned_agents.length).toBe(2);
    expect(result.properties.issues.unassigned_jobs.length).toBe(2);
    expect(result.properties).toBeDefined();
    expect(JSON.stringify(result.properties.params))
        .toBe(JSON.stringify(
            {mode: 'drive', agents: planner.agents, jobs: planner.jobs, shipments: planner.shipments, locations: planner.locations}
        ));
    testAllPrimitiveFeatureFieldsArePopulated(result);
    testAllLegFieldsArePopulated(result.features[0].properties.legs![0]);
    expect(result.features[0].properties.actions[2].job_index).toBeDefined()
  });


  test('should return issue object for invalid request to Route Planner API', async () => {
    const planner = new RoutePlanner(API_KEY);

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

  function testAllWaypointFieldsArePopulated(firstWaypoint: RPWaypoint) {
    expect(firstWaypoint.original_location).toBeDefined();
    expect(firstWaypoint.location).toBeDefined();
    expect(firstWaypoint.start_time).toBeDefined();
    expect(firstWaypoint.duration).toBeDefined();
    expect(firstWaypoint.actions[1].index).toBeDefined();
    expect(firstWaypoint.actions[1].type).toBeDefined();
    expect(firstWaypoint.actions[1].start_time).toBeDefined();
    expect(firstWaypoint.actions[1].duration).toBeDefined();
    expect(firstWaypoint.actions[1].shipment_index).toBeDefined();
    expect(firstWaypoint.actions[1].shipment_id).toBeDefined();
    expect(firstWaypoint.actions[1].location_index).toBeDefined();
    expect(firstWaypoint.actions[1].location_id).toBeDefined();
    expect(firstWaypoint.actions[1].waypoint_index).toBeDefined();
    expect(firstWaypoint.original_location_index).toBeDefined();
    expect(firstWaypoint.original_location_id).toBeDefined();
    expect(firstWaypoint.prev_leg_index).toBeDefined();
    expect(firstWaypoint.next_leg_index).toBeDefined();
  }

  function testAllActionFieldsArePopulated(nextAction: RPAction) {
    expect(nextAction.index).toBeDefined();
    expect(nextAction.type).toBeDefined();
    expect(nextAction.start_time).toBeDefined();
    expect(nextAction.duration).toBeDefined();
    expect(nextAction.shipment_index).toBeDefined();
    expect(nextAction.shipment_id).toBeDefined();
    expect(nextAction.location_index).toBeDefined();
    expect(nextAction.location_id).toBeDefined();
    expect(nextAction.waypoint_index).toBeDefined();
  }

  function testAllLegFieldsArePopulated(firstLeg: RPLeg) {
    expect(firstLeg.time).toBeDefined();
    expect(firstLeg.distance).toBeDefined();
    expect(firstLeg.from_waypoint_index).toBeDefined();
    expect(firstLeg.to_waypoint_index).toBeDefined();
    expect(firstLeg.steps[0].from_index).toBeDefined();
    expect(firstLeg.steps[0].to_index).toBeDefined();
    expect(firstLeg.steps[0].time).toBeDefined();
    expect(firstLeg.steps[0].distance).toBeDefined();
  }

  function testAllPrimitiveFeatureFieldsArePopulated(result: RoutePlannerResult) {
    expect(result.features).toBeDefined();
    expect(result.features[0].type).toBe("Feature");
    expect(result.features[0].geometry.type).toBe("MultiLineString");
    expect(result.features[0].geometry.coordinates).toBeDefined();
    expect(result.features[0].properties.agent_index).toBeDefined();
    expect(result.features[0].properties.time).toBeDefined();
    expect(result.features[0].properties.start_time).toBeDefined();
    expect(result.features[0].properties.end_time).toBeDefined();
    expect(result.features[0].properties.distance).toBeDefined();
  }
});
