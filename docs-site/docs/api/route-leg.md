# `RouteLeg`

The `RouteLeg` class represents a travel segment between two waypoints in an agent's route. Each leg includes distance, time, and a breakdown of navigation steps that make up that leg.

This class is essential for visualizing or analyzing the travel portion between stops — for example, drawing map paths or calculating costs per leg.

---

## Purpose

Use `RouteLeg` to:

- Inspect the time and distance between two stops
- Visualize or simulate movement along the route
- Access fine-grained navigation data via steps
- Link travel segments to `Waypoint` indices

---

## Constructor

```ts
new RouteLeg(raw: RouteLegData)
```

Initializes a `RouteLeg` with full travel details. Throws an error if no data is passed.

---

## Methods

| Method                   | Description                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `getRaw()`               | Returns the internal `RouteLegData` object                                                 |
| `getTime()`              | Total travel time (in seconds) for the leg                                                 |
| `getDistance()`          | Total distance (in meters) for the leg                                                     |
| `getFromWaypointIndex()` | Index of the start waypoint                                                                |
| `getToWaypointIndex()`   | Index of the destination waypoint                                                          |
| `getSteps()`             | Returns an array of [`RouteLegStep`](./route-leg-step.md) objects for turn-by-turn details |

---

## Example

```ts
const leg = new RouteLeg(data);

console.log("Travel time:", leg.getTime());
console.log("Distance:", leg.getDistance());

const steps = leg.getSteps();
steps.forEach((step) => console.log(step.getTime(), step.getDistance()));
```

This allows you to break down travel details between two route points, for cost estimation or animation.

---

## Related

* [`Waypoint`](./waypoint.md) – source and target of each leg
* [`RouteLegStep`](./route-leg-step.md) – detailed instructions or segments within the leg
* [`AgentSolution`](./agent-solution.md) – contains a list of all route legs
