# `RouteAction`

The `RouteAction` class represents a single step or task that an agent performs along their route. It encapsulates what happens, when it happens, and how it relates to jobs, shipments, and locations.

Actions are the atomic units of execution in the result and can include types like `start`, `pickup`, `delivery`, and `end`.

---

## Purpose

Use `RouteAction` to:

- Understand what the agent does at each stop
- Determine the timing and duration of actions
- Trace actions back to jobs or shipments
- Build execution timelines or visual route logs

Each action is tied to a specific waypoint and contributes to the route's structure and semantics.

---

## Constructor

```ts
new RouteAction(raw: RouteActionData)
```

Creates a `RouteAction` from raw result data. Throws an error if no data is provided.

---

## Methods

| Method           | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `getRaw()`       | Returns the internal `RouteActionData` object                       |
| `getType()`      | Returns the action type: `start`, `pickup`, `delivery`, `end`, etc. |
| `getStartTime()` | Time (in seconds) when the action begins                            |
| `getDuration()`  | How long the action takes (in seconds)                              |

### Job and Shipment Linking

| Method               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `getJobIndex()`      | Index of the job in the original `jobs[]` array |
| `getJobId()`         | Custom ID of the job (if set)                   |
| `getShipmentIndex()` | Index of the shipment (if applicable)           |
| `getShipmentId()`    | Custom ID of the shipment (if set)              |

### Location Metadata

| Method               | Description                                      |
| -------------------- | ------------------------------------------------ |
| `getLocationIndex()` | Index in the shared `locations[]` list           |
| `getLocationId()`    | Custom ID of the location (if provided)          |
| `getWaypointIndex()` | Index of the corresponding waypoint in the route |

---

## Example

```ts
const action = new RouteAction(data);

console.log(action.getType()); // 'pickup'
console.log(action.getStartTime()); // 3600 (1 hour into route)
```

You can use route actions to generate step-by-step timelines or visualize delivery workflows.

---

## Related

* [`AgentSolution`](./agent-solution.md) – contains all actions for an agent
* [`JobSolution`](./job-solution.md) – filters actions by job
* [`Waypoint`](./waypoint.md) – location where actions take place
* [`RouteLeg`](./route-leg.md) – the travel segment between actions
