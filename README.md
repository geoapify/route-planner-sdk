# Geoapify Route Optimization SDK

[![Docs](https://img.shields.io/badge/Docs-View%20Documentation-blue)](https://geoapify.github.io/route-planner-sdk/)
[![npm version](https://img.shields.io/npm/v/@geoapify/route-planner-sdk)](https://www.npmjs.com/package/@geoapify/route-planner-sdk)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)


The **Geoapify Route Optimization SDK** is a lightweight, dependency-free TypeScript library that simplifies building, executing requests, and modifying results for the [Geoapify Route Planner API](https://www.geoapify.com/route-planner-api/). It helps you easily implement advanced **route optimization** and delivery planning in both frontend (browser) and backend (Node.js) environments.

![Delivery Routes Optimization](https://github.com/geoapify/route-planner-sdk/blob/main/img/delivery-routes-optimization.png?raw=true)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Getting API Key](#getting-api-key)
  - [Import the SDK](#import-the-sdk)
  - [Example: Create Shipment / Delivery Task](#example-create-shipment--delivery-task)
  - [Example: Create Job Optimization Task](#example-create-job-optimization-task)
- [Full Documentation](#full-documentation)
- [Modifying Route Results](#modifying-route-results)
  - [Example: Assign Jobs to the Agent](#example-assign-jobs-to-the-agent)
  - [Example: Assign Shipments to the Agent](#example-assign-shipments-to-the-agent)
  - [Example: Remove Jobs](#example-remove-jobs)
  - [Example: Remove Shipments](#example-remove-shipments)
  - [Example: Add New Jobs](#example-add-new-jobs)
  - [Example: Add New Shipments](#example-add-new-shipments)
- [Timeline Generation](#timeline-generation)
  - [Example: Generate Placeholder Timeline without Waypoints](#example-generate-placeholder-timeline-without-waypoints)
  - [Example: Generate Timeline with Optimized Routes](#example-generate-timeline-with-optimized-routes)
  - [Example: Timeline with Custom Popup and Agent Actions](#example-timeline-with-custom-popup-and-agent-actions)
  - [Timeline Setup Requirements](#timeline-setup-requirements)
- [Useful Links](#useful-links)
- [When to Use](#when-to-use)

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

### Example: Create Shipment / Delivery Task

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

### Example: Create Job Optimization Task

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

## Full Documentation

Looking for full API references, usage examples, and SDK architecture details?

👉 **Explore the full documentation here:**  
[https://geoapify.github.io/route-planner-sdk/](https://geoapify.github.io/route-planner-sdk/)

## Modifying Route Results

You can edit planned routes easily using `RoutePlannerResultEditor`.

### Example: Assign jobs to the agent

```ts
const routeEditor = new RoutePlannerResultEditor(result);
await routeEditor.assignJobs('agent-a', ['job-2']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Example: Assign shipments to the agent

```ts
const routeEditor = new RoutePlannerResultEditor(result);
await routeEditor.assignShipments('agent-b', ['shipment-2']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Example: Remove jobs

```ts
const routeEditor = new RoutePlannerResultEditor(plannerResult);
await routeEditor.removeJobs(['job-2']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Example: Remove shipments

```ts
const routeEditor = new RoutePlannerResultEditor(plannerResult);
await routeEditor.removeShipments(['shipment-4']);
let modifiedResult = routeEditor.getModifiedResult();
```

### Example: Add new jobs

```ts
let newJob = new Job()
    .setLocation(44.50932929564537, 40.18686625)
    .setPickupAmount(10)
    .setId("job-5");
await routeEditor.addNewJobs('agent-A', [newJob]);
let modifiedResult = routeEditor.getModifiedResult();
```

### Example: Add new shipments

```ts
let newShipment = new Shipment()
    .setPickup(new ShipmentStep().setLocation(44.50932929564537, 40.18686625).setDuration(1000))
    .setDelivery(new ShipmentStep().setLocation(44.50932929564537, 40.18686625))
    .addRequirement('heavy-items')
    .setId("shipment-5");
await routeEditor.addNewShipments('agent-A', [newShipment]);
let modifiedResult = routeEditor.getModifiedResult();
```

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

###  Example: Generate Timeline with Optimized Routes

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


## Useful Links

- [Geoapify Route Planner API Overview](https://www.geoapify.com/route-planner-api/)
- [API Playground](https://apidocs.geoapify.com/playground/route-planner/)
- [API Documentation](https://apidocs.geoapify.com/docs/route-planner/)

## When to Use

The **Geoapify Route Optimization SDK** is ideal for:

- Delivery and logistics platforms
- Multi-agent job dispatching
- Shipment planning and optimization
- Interactive route editing and visualization

Simplify your logistics and delivery operations with automated and flexible route optimization.
