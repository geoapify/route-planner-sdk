# Geoapify Route Optimization SDK

The **Geoapify Route Optimization SDK** is a lightweight, dependency-free TypeScript library that simplifies building, executing requests, and modifying results for the [Geoapify Route Planner API](https://www.geoapify.com/route-planner-api/). It helps you easily implement advanced **route optimization** and delivery planning in both frontend (browser) and backend (Node.js) environments.

---

## Features

- Easy-to-use route optimization and delivery planning.
- Works in browser and Node.js environments.
- No dependencies and minimal package size.
- Modify and edit route results after planning.

---

## Installation

Install the SDK from NPM:

```bash
npm install @geoapify/route-planner-sdk
```

---

## Quick Start

### Getting API Key

To use the Route Optimization SDK, you need a valid **Geoapify API Key**.

1. Go to the [Geoapify page](https://www.geoapify.com/).
2. Sign up for a Geoapify account. No credit card is required.
3. Use the created by default or create a new API key.

You can start with the **Free Plan** which includes usage limits suitable for testing and small projects.
For commercial use and higher request volumes, consider upgrading your plan.

### Import the SDK

```ts
import RoutePlanner, { Agent, Job } from "@geoapify/route-planner-sdk";
const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" });
```

Or use in HTML:

```html
<script src="./node_modules/@geoapify/route-planner-sdk/dist/index.min.js"></script>
<script>
  const planner = new RoutePlannerSDK.RoutePlanner({ apiKey: "YOUR_API_KEY" });
</script>
```

### Basic Route Optimization Example

```ts
await planner
    .setMode("drive")
    .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
    .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
    .plan();
```
or

```ts
const routePlannerData: RoutePlannerInputData = {
    agents: [...],
    jobs: [...],
    max_speed: 100
};
const planner = new RoutePlanner({apiKey: API_KEY}, routePlannerData);

```
---

## Advanced Usage

### Create Shipment / Delivery task

```ts
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
```

### Create job optimization task

```js
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
```

---

## Modifying Route Results

You can edit planned routes easily using `RoutePlannerResultEditor`.

### Assign jobs to the agent

```ts
const routeEditor = new RoutePlannerResultEditor(result);
await routeEditor.assignJobs('agent-a', ['job-2']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Assign shipments to the agent

```ts
const routeEditor = new RoutePlannerResultEditor(result);
await routeEditor.assignShipments('agent-b', ['shipment-2']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Remove jobs

```ts
const routeEditor = new RoutePlannerResultEditor(plannerResult);
await routeEditor.removeJobs(['job-2']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Remove shipments

```ts
const routeEditor = new RoutePlannerResultEditor(plannerResult);
await routeEditor.removeShipments(['shipment-4']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Add new jobs

```ts
let newJob = new Job()
    .setLocation(44.50932929564537, 40.18686625)
    .setPickupAmount(10)
    .setId("job-5");
await routeEditor.addNewJobs('agent-A', [newJob]);
let modifiedResult = routeEditor.getModifiedResult();
```

### Add new shipments

```ts
let newShipment = new Shipment()
    .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
    .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
    .addRequirement('heavy-items')
    .setId("shipment-5");
await routeEditor.addNewShipments('agent-A', [newShipment]);
let modifiedResult = routeEditor.getModifiedResult();
```

---

## Documentation

### RoutePlanner Class

| Method / Property                         | Description                                                                                                 | Parameters / Types                                      | Returns                              |
|------------------------------------------|-------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|--------------------------------------|
| `constructor(options, raw?)`             | Creates a new `RoutePlanner` instance with provided options and optional input data.                        | `options: RoutePlannerOptions`<br>`raw?: RoutePlannerInputData` | `RoutePlanner` instance             |
| `getRaw()`                               | Returns the current raw input data.                                                                         | –                                                      | `RoutePlannerInputData`             |
| `setRaw(value)`                          | Sets or replaces the raw input data.                                                                        | `value: RoutePlannerInputData`                         | `this`                               |
| `setMode(mode)`                          | Sets the travel mode used for route optimization.                                                           | `mode: TravelMode`                                     | `this`                               |
| `addAgent(agent)`                        | Adds an agent (e.g. vehicle, driver) to the route planner.                                                  | `agent: Agent`                                         | `this`                               |
| `addJob(job)`                            | Adds a job (task) to be assigned to an agent.                                                               | `job: Job`                                             | `this`                               |
| `addLocation(location)`                  | Adds a location reference.                                                                                  | `location: Location`                                   | `this`                               |
| `addShipment(shipment)`                  | Adds a shipment task with pickup and delivery steps.                                                        | `shipment: Shipment`                                   | `this`                               |
| `addAvoid(avoid)`                        | Adds an area or rule to avoid during routing.                                                               | `avoid: Avoid`                                         | `this`                               |
| `setTraffic(traffic)`                    | Sets the traffic model used for optimization.                                                               | `traffic: TrafficType`                                 | `this`                               |
| `setType(type)`                          | Sets the route optimization strategy (e.g., shortest, balanced).                                            | `type: RouteType`                                      | `this`                               |
| `setMaxSpeed(max_speed)`                 | Defines maximum allowed speed for agents.                                                                   | `max_speed: number`                                    | `this`                               |
| `setUnits(units)`                        | Sets measurement units (metric, imperial).                                                                  | `units: DistanceUnitType`                              | `this`                               |
| `plan()`                                 | Sends the route planning request and returns the optimized result.                                           | –                                                      | `Promise<RoutePlannerResult>`       |

---

### RoutePlannerResultEditor Class

| Method / Property                                         | Description                                                                                                  | Parameters / Types                                              | Returns                              |
|----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|--------------------------------------|
| `constructor(result)`                                    | Creates a new `RoutePlannerResultEditor` instance from an existing route planner result.                    | `result: RoutePlannerResult`                                    | `RoutePlannerResultEditor` instance |
| `assignJobs(agentId, jobIds)`                            | Assigns one or more jobs to an agent. Removes the job if it was previously assigned to another agent.        | `agentId: string`<br>`jobIds: string[]`                          | `Promise<boolean>`                  |
| `assignShipments(agentId, shipmentIds)`                  | Assigns one or more shipments to an agent. Removes them from other agents if previously assigned.            | `agentId: string`<br>`shipmentIds: string[]`                    | `Promise<boolean>`                  |
| `removeJobs(jobIds)`                                     | Removes specified jobs from the plan.                                                                       | `jobIds: string[]`                                              | `Promise<boolean>`                  |
| `removeShipments(shipmentIds)`                           | Removes specified shipments from the plan.                                                                  | `shipmentIds: string[]`                                        | `Promise<boolean>`                  |
| `addNewJobs(agentId, jobs)`                              | Adds new jobs to an agent's schedule.                                                                       | `agentId: string`<br>`jobs: Job[]`                               | `Promise<boolean>`                  |
| `addNewShipments(agentId, shipments)`                    | Adds new shipments to an agent's schedule.                                                                  | `agentId: string`<br>`shipments: Shipment[]`                    | `Promise<boolean>`                  |
| `getModifiedResult()`                                    | Returns the modified route planner result after editing.                                                    | –                                                                | `RoutePlannerResult`                |

---

## Useful Links

- [Geoapify Route Planner API Overview](https://www.geoapify.com/route-planner-api/)
- [API Playground](https://apidocs.geoapify.com/playground/route-planner/)
- [API Documentation](https://apidocs.geoapify.com/docs/route-planner/)

---

## When to Use

The **Geoapify Route Optimization SDK** is ideal for:

- Delivery and logistics platforms
- Multi-agent job dispatching
- Shipment planning and optimization
- Interactive route editing and visualization

Simplify your logistics and delivery operations with automated and flexible route optimization.
