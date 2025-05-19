# `Waypoint`

A `Waypoint` represents a physical location in an agent’s route where one or more actions (e.g., pickup, delivery, start, end) occur. It includes information about its coordinates, when the agent will arrive, how long they will stay, and the actions performed.

Waypoints are central to building **timelines**, **visual routes**, and **event logs** for each agent.

---

## Purpose

Use `Waypoint` to:

- Determine when and where an agent stops
- See which jobs or shipments are performed at each stop
- Build route visualization or Gantt timelines
- Link travel segments before/after the stop

---

## Constructor

```ts
new Waypoint(raw: WaypointData)
```

Creates a `Waypoint` from raw result data. Throws an error if data is missing.

---

## Methods

### Location & Identification

| Method                       | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `getOriginalLocation()`      | Coordinates of the declared location (input)    |
| `getOriginalLocationIndex()` | Index in the `locations[]` array (if used)      |
| `getOriginalLocationId()`    | ID of the input location (if set)               |
| `getLocation()`              | Final matched location after route optimization |

### Timing

| Method           | Description                                   |
| ---------------- | --------------------------------------------- |
| `getStartTime()` | Time when the agent arrives at the waypoint   |
| `getDuration()`  | Total duration spent at the stop (in seconds) |

### Actions

| Method         | Description                                                                             |
| -------------- | --------------------------------------------------------------------------------------- |
| `getActions()` | Returns a list of [`RouteAction`](./route-action.md) objects performed at this location |

### Route Position

| Method              | Description                                         |
| ------------------- | --------------------------------------------------- |
| `getPrevLegIndex()` | Index of the route leg leading into this waypoint   |
| `getNextLegIndex()` | Index of the route leg going out from this waypoint |

---

## Example

```ts
const waypoint = new Waypoint(data);

console.log("Arrives at:", waypoint.getStartTime());
console.log("Does:", waypoint.getActions().map(a => a.getType()).join(", "));
```

---

## Use Cases

* Timeline visualizations for dispatchers
* Gantt-style charts for mobile agents
* Stop-by-stop maps and reports
* Popup details in interactive maps

---

## Related

* [`RouteAction`](./route-action.md) – actions executed at this location
* [`AgentSolution`](./agent-solution.md) – contains a list of waypoints
* [`RouteLeg`](./route-leg.md) – links between waypoints

