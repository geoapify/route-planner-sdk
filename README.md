# Geoapify Route Optimization SDK

The **Geoapify Route Optimization SDK** is a lightweight, dependency-free TypeScript library that simplifies building, executing requests, and modifying results for the [Geoapify Route Planner API](https://www.geoapify.com/route-planner-api/). It helps you easily implement advanced **route optimization** and delivery planning in both frontend (browser) and backend (Node.js) environments.

![Delivery Routes Optimization](https://github.com/geoapify/route-planner-sdk/blob/main/img/delivery-routes-optimization.png?raw=true)

## Features

The Geoapify Route Optimization SDK provides a modern, dependency-free way to interact with the [Geoapify Route Planner API](https://apidocs.geoapify.com/docs/route-planner/), making it easy to implement complex logistics workflows in both browser and backend environments.

**Supported Use Cases**:

- Route optimization
- Delivery planning
- Pickup/drop-off scheduling
- Time-constrained and multi-agent logistics

**Developer Convenience**:

- Build and send optimization requests
- Interpret results (e.g., agent timelines, task sequences)
- Reassign jobs or shipments between agents
- Modify planned routes dynamically


**Visualization Support**:

- Extract structured timeline and status data for each agent
- Analyze and display routes and schedules using charts or maps

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

## Timeline Generation

`RoutePlannerTimeline` generates a visual timeline for delivery routes, agents, waypoints, and jobs. It can display either the planned input data or the computed solution, supporting both time-based and distance-based views.

![Timeline example](https://github.com/geoapify/route-planner-sdk/blob/main/img/timeline.png?raw=true)

### Features
- Visualizes agent timelines for delivery or pickup tasks
- Supports "time" or "distance" modes
- Customizable agent colors, labels, and capacity units
- Optional waypoint popup details and three-dot agent menus

###  Example: Generate Placeholder Timeline without Waypoints

Creates an empty placeholder timeline based solely on the input data — no routing solution is computed, and no waypoints are included:

```ts

const container = document.getElementById('timeline-container');

new RoutePlannerTimeline(container, inputData, undefined, {
      timelineType: 'time',
      hasLargeDescription: false,
      capacityUnit: 'liters',
      agentLabel: 'Truck',
      label: "Simple delivery route planner",
      description: "Deliver ordered items to customers within defined timeframe",
      agentColors: ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
        "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"],
    }
);
```

You can first generate an empty placeholder timeline and later initialize it using the `setResult()` function with the routing result data

###  Example: Generate Timeline with Routing Solution

Displays a complete timeline that includes the computed routing results, along with interactive waypoint popups for each stop.

Let me know if you'd like to emphasize route optimization, travel times, or interactivity more explicitly.

```ts
const container = document.getElementById('timeline-container');

new RoutePlannerTimeline(container, inputData, result, {
        timelineType: 'time',
        hasLargeDescription: false,
        capacityUnit: 'liters',
        agentLabel: 'Truck',
        label: "Simple delivery route planner",
        description: "Deliver ordered items to customers within defined timeframe",
        showWaypointPopup: true,
        agentColors: ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
          "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"],
      }
);
```

### Example: Timeline with Custom Popup and Agent Actions

```ts
const customWaypointPopupGenerator = (waypoint: Waypoint): HTMLElement => {
  const popupDiv = document.createElement('div');
  popupDiv.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <h4 style="margin: 0">${[...new Set(waypoint.getActions().map(
        action => action.getType().charAt(0).toUpperCase() + action.getType().slice(1))
      )].join(' / ')}</h4>
      <p style="margin: 0">Duration: ${this.toPrettyTime(waypoint.getDuration()) || 'N/A'}</p>
      <p style="margin: 0">Time Before: ${this.toPrettyTime(waypoint.getStartTime()) || 'N/A'}</p>
      <p style="margin: 0">Time After: ${this.toPrettyTime(waypoint.getStartTime() + waypoint.getDuration()) || 'N/A'}</p>
    </div>`;
  return popupDiv;
};

const agentActions: TimelineMenuItem[] = [
  {
    key: 'show-hide-agent',
    label: 'Change Visibility',
    callback: (agentIndex: number) => {
      console.log(`Agent ${agentIndex} visibility toggled`);
    }
  },
  {
    key: 'second-button',
    label: 'Test Button',
    callback: (agentIndex: number) => {
      console.log(`Agent ${agentIndex} test button clicked`);
    }
  }
];

const container = document.getElementById('timeline-container');

const timeline = new RoutePlannerTimeline(container, inputData, undefined, {
  timelineType: 'time',
  hasLargeDescription: false,
  capacityUnit: 'liters',
  agentLabel: 'Truck',
  label: 'Simple delivery route planner',
  description: 'Deliver ordered items to customers within defined timeframe',
  timeLabels: this.timeLabels, // optional
  showWaypointPopup: true,
  waypointPopupGenerator: customWaypointPopupGenerator,
  agentMenuItems: agentActions,
  agentColors: ['#ff4d4d', '#1a8cff', '#00cc66', '#b300b3']
});

// Optional: Listen to hover events
timeline.on('onWaypointHover', (waypoint: Waypoint) => {
  console.log('Hovered waypoint:', waypoint);
});
```


### Timeline Setup Requirements

- Include the timeline-specific CSS: `./node_modules/@geoapify/route-planner-sdk/styles/minimal.css`
- Ensure that your HTML container (`'timeline-container'`) is present and ready to render the timeline
- Import the necessary types for the timeline feature, such as `RoutePlannerInputData` and `RoutePlannerResult`

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


### RoutePlannerTimeline Class

| Method / Property                     | Description                                                                                           | Parameters / Types                                                                                  | Returns                          |
|--------------------------------------|-------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|----------------------------------|
| `constructor(container, inputData?, result?, options?)` | Creates a new `RoutePlannerTimeline` instance to visualize the timeline for agents and waypoints.     | `container: HTMLElement`<br>`inputData?: RoutePlannerInputData`<br>`result?: RoutePlannerResult`<br>`options?: RoutePlannerTimelineOptions` | `RoutePlannerTimeline` instance  |
| `getHasLargeDescription()`           | Checks if large description layout is enabled.                                                        | –                                                                                                   | `boolean \| undefined`           |
| `setHasLargeDescription(value)`      | Sets whether to use large description layout.                                                         | `value: boolean`                                                                                    | `void`                           |
| `getTimelineType()`                  | Gets the current timeline type (time or distance).                                                     | –                                                                                                   | `'time' \| 'distance' \| undefined` |
| `setTimelineType(value)`             | Sets the timeline type to `'time'` or `'distance'`.                                                   | `value: 'time' \| 'distance'`                                                                       | `void`                           |
| `getAgentColors()`                   | Retrieves the list of agent colors.                                                                   | –                                                                                                   | `string[] \| undefined`          |
| `setAgentColors(value)`              | Sets the color list for agents.                                                                       | `value: string[]`                                                                                   | `void`                           |
| `getCapacityUnit()`                  | Gets the unit used for capacity display (e.g., items, kg).                                            | –                                                                                                   | `string \| undefined`            |
| `setCapacityUnit(value)`             | Sets the capacity unit label.                                                                         | `value: string`                                                                                     | `void`                           |
| `getTimeLabels()`                    | Retrieves the timeline time labels.                                                                   | –                                                                                                   | `RoutePlannerTimelineLabel[] \| undefined` |
| `setTimeLabels(value)`               | Sets the timeline time labels.                                                                        | `value: RoutePlannerTimelineLabel[]`                                                                | `void`                           |
| `getDistanceLabels()`                | Retrieves the timeline distance labels.                                                               | –                                                                                                   | `RoutePlannerTimelineLabel[] \| undefined` |
| `setDistanceLabels(value)`           | Sets the timeline distance labels.                                                                    | `value: RoutePlannerTimelineLabel[]`                                                                | `void`                           |
| `getAgentLabel()`                    | Gets the label used for agents (e.g., “Agent”, “Driver”).                                             | –                                                                                                   | `string \| undefined`            |
| `setAgentLabel(value)`               | Sets the label for agents.                                                                            | `value: string`                                                                                     | `void`                           |
| `getAgentMenuItems()`                | Gets the configured three-dot menu items for agents.                                                   | –                                                                                                   | `TimelineMenuItem[] \| undefined` |
| `setAgentMenuItems(value)`           | Sets the menu items for the agent’s three-dot menu.                                                   | `value: TimelineMenuItem[]`                                                                         | `void`                           |
| `getResult()`                        | Retrieves the current `RoutePlannerResult`.                                                           | –                                                                                                   | `RoutePlannerResult \| undefined` |
| `setResult(value)`                   | Sets a new `RoutePlannerResult` and regenerates the timeline.                                         | `value: RoutePlannerResult`                                                                         | `void`                           |
| `on(eventName, handler)`             | Registers an event listener (e.g., for `onWaypointHover`).                                            | `eventName: string`<br>`handler: Function`                                                          | `void`                           |
| `off(eventName, handler)`            | Removes a previously registered event listener.                                                       | `eventName: string`<br>`handler: Function`                                                          | `void`                           |
| `getAgentColorByIndex(index)`        | Retrieves the color assigned to a given agent index.                                                  | `index: number`                                                                                     | `string`                         |


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
