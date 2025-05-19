# `AgentSolution`

The `AgentSolution` class represents the full route execution plan for a single agent after optimization. It includes all scheduled stops, travel segments, performed actions, and associated timing data.

Each instance of `AgentSolution` is part of the overall result returned by the Geoapify Route Planner and corresponds to one agent (driver, vehicle, or worker).

---

## Purpose

Use `AgentSolution` to:

- Inspect an agent’s full route: sequence, distance, and duration
- Analyze detailed execution steps (actions, waypoints, travel legs)
- Generate visualizations (timelines, route paths, task lists)
- Support manual or programmatic editing of agent plans

---

## Constructor

```ts
new AgentSolution(raw: AgentSolutionData)
```

Initializes a new solution based on raw planner output. Throws an error if no data is provided.

---

## Methods

### Agent Info

| Method            | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `getAgentIndex()` | Returns the agent’s index in the original `agents[]` input |
| `getAgentId()`    | Returns the agent’s `id` if defined in input               |
| `getMode()`       | Returns the mode of transport used (e.g., `"drive"`)       |

### Timing

| Method           | Description                       |
| ---------------- | --------------------------------- |
| `getTime()`      | Total travel time (seconds)       |
| `getStartTime()` | Time the agent begins execution   |
| `getEndTime()`   | Time the agent finishes all tasks |

### Distance

| Method          | Description                                     |
| --------------- | ----------------------------------------------- |
| `getDistance()` | Total distance (in meters) of the agent's route |

---

## Route Breakdown

| Method           | Description                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `getLegs()`      | Returns an array of [`RouteLeg`](./route-leg.md) objects representing travel segments                                       |
| `getActions()`   | Returns an array of [`RouteAction`](./route-action.md) objects representing execution steps like `pickup`, `delivery`, etc. |
| `getWaypoints()` | Returns an array of [`Waypoint`](./waypoint.md) objects corresponding to stops along the route                              |

These objects provide the full breakdown of an agent’s route — allowing fine-grained control for visualization, simulation, and editing.

---

## Example

```ts
const agentPlan = new AgentSolution(data);
const waypoints = agentPlan.getWaypoints();
const totalTime = agentPlan.getTime();
```

This reads and analyzes the result for a specific agent — including location-by-location breakdown.

---

## Related

* [`RoutePlannerResult`](./route-planner-result.md) – entry point for accessing all `AgentSolution` objects
* [`RouteLeg`](./route-leg.md) – represents travel segments
* [`RouteAction`](./route-action.md) – represents individual execution events
* [`Waypoint`](./waypoint.md) – represents stop locations and timings
