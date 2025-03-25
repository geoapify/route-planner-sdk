# Geoapify Route Planner SDK

## Overview
The **Geoapify Route Planner SDK** is a lightweight, dependency-free TypeScript library that simplifies building, executing, and processing requests for the [Geoapify Route Planner API](https://apidocs.geoapify.com/docs/route-planner/). It is designed to work in both frontend (browser) and backend (Node.js) environments.

## Features
- **Request Building**: Easily configure route planning requests with agents, jobs, shipments, and locations.
- **Cross-Platform Support**: Works seamlessly in frontend and backend environments using a universal fetch wrapper.
- **Zero Dependencies**: Built for lightweight integration.

## Installation
```sh
npm install @geoapify/route-planner-sdk
```

## Building the SDK
```sh
npm run build
```

## Running Tests
```sh
npm test
```

## Quick Start


## Importing the SDK

    import RoutePlanner, { Agent, Job } from "@geoapify/route-planner-sdk";

## Creating a Route Planner Instance

    const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" });

## Usage in HTML

Include the SDK via script tag:

    <script src="./node_modules/@geoapify/route-planner-sdk/dist/index.min.js"></script>
    <script>
      const planner = new RoutePlannerSDK.RoutePlanner({ apiKey: "YOUR_API_KEY" });
    </script>


### Building and Sending a Route Request
    await planner
        .setMode("drive")
        .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
        .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
        .plan();

### Create a RoutePlanner from raw data
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

### Create Shipment / Delivery task
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

### Create job optimization task
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

## Modifying Route Planner Results

### Assign jobs to the agent
    const routeEditor = new RoutePlannerResultEditor(result);
    await routeEditor.assignJobs('agent-a', ['job-2']);
    let modifiedResult = routeEditor.getModifiedResult();

### Assign shipments to the agent
    const routeEditor = new RoutePlannerResultEditor(result);
    await routeEditor.assignShipments('agent-b', ['shipment-2']);
    let modifiedResult = routeEditor.getModifiedResult();

### Remove jobs
    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.removeJobs(['job-2']);
    let modifiedResult = routeEditor.getModifiedResult();

### Remove shipments
    const routeEditor = new RoutePlannerResultEditor(plannerResult);
    await routeEditor.removeShipments(['shipment-4']);
    let modifiedResult = routeEditor.getModifiedResult();

### Add new jobs
    let newJob = new Job()
        .setLocation(44.50932929564537, 40.18686625)
        .setPickupAmount(10)
        .setId("job-5");
    await routeEditor.addNewJobs('agent-A', [newJob]);
    let modifiedResult = routeEditor.getModifiedResult();

### Add new shipments
    let newShipment = new Shipment()
        .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
        .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
        .addRequirement('heavy-items')
        .setId("shipment-5");
    await routeEditor.addNewShipments('agent-A', [newShipment]);
    let modifiedResult = routeEditor.getModifiedResult();

## API Documentation
For more details, visit:
- **[API Playground](https://apidocs.geoapify.com/playground/route-planner/)** – Test and generate API requests.
- **[API Documentation](https://apidocs.geoapify.com/docs/route-planner/)** – Complete reference for API endpoints and parameters.