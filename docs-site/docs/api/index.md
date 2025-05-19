# API Overview

The **Geoapify Route Optimization SDK** provides a structured, TypeScript-first interface for interacting with the [Geoapify Route Planner API](https://www.geoapify.com/route-planner-api/). It simplifies the process of building and sending optimization requests, interpreting results, modifying assignments, and visualizing agent plans.

---

## Modules

The SDK is organized into three key parts:

### 1. **Core Classes**

| Class | Purpose |
|-------|---------|
| [`RoutePlanner`](./route-planner.md) | Build and execute route planning requests |
| [`RoutePlannerResult`](./route-planner-result.md) | Parse and analyze route results |
| [`RoutePlannerResultEditor`](./route-planner-result-editor.md) | Reassign or modify jobs/shipments |
| [`RoutePlannerTimeline`](./route-planner-timeline.md) | Render timelines for UI/visualization |

---

### 2. **Entities (Input Objects)**

Use these to define the input for your route plan:

| Entity | Description |
|--------|-------------|
| [`Agent`](./agent.md) | Represents a resource (driver, worker, vehicle) |
| [`Job`](./job.md) | Task or delivery to perform at a location |
| [`Shipment`](./shipment.md) | Pickup + delivery pair |
| [`Location`](./location.md) | Reusable named coordinate reference |
| [`Avoid`](./avoid.md) | Travel restrictions (e.g., avoid toll roads) |

---

### 3. **Entities (Result Objects)**

These classes help interpret and structure the result of the route planner:

| Entity | Description |
|--------|-------------|
| [`AgentSolution`](./agent-solution.md) | Full plan for an agent: route, actions, timeline |
| [`Waypoint`](./waypoint.md) | Stops where agent performs tasks |
| [`RouteAction`](./route-action.md) | Actions like pickup, delivery, break |
| [`RouteLeg`](./route-leg.md) | Segment between waypoints |
| [`JobSolution`](./job-solution.md) | Links a job to an agent and timeline |
| [`ShipmentSolution`](./shipment-solution.md) | Links a shipment to agent and execution steps |

---

## Typical Flow

```ts
// 1. Build input
const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" });
planner
  .setMode("drive")
  .addAgent(new Agent().setStartLocation(...))
  .addJob(new Job().setLocation(...));

// 2. Execute
const result = await planner.plan();

// 3. Explore result
const agents = result.getAgentSolutions();
const waypoints = result.getAgentWaypoints("agent-1");

// 4. Modify if needed
const editor = new RoutePlannerResultEditor(result);
await editor.assignJobs("agent-2", ["job-3"]);
```

---

## UI Integration

* Use [`RoutePlannerTimeline`](./route-planner-timeline.md) to create interactive, embeddable views of agent schedules.
* Build dashboards, map overlays, or edit tools on top of these components.

---

## Learn More

* [Installation](../installation-and-import.md)
* [Core Concepts](../entities.md)
* [Understanding Results](../results.md)
* [SDK Playground](https://apidocs.geoapify.com/playground/route-planner/)