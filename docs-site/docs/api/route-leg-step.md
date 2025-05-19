# `RouteLegStep`

The `RouteLegStep` class provides a fine-grained breakdown of a travel leg between two waypoints. Each step represents a segment of the road network — such as a turn, road segment, or instruction — with its own time, distance, and coordinate reference.

This class is especially useful for building animated route visualizations or generating navigation-style instructions.

---

## Purpose

Use `RouteLegStep` to:

- Animate route drawing step-by-step
- Analyze the path taken between stops
- Estimate costs or timing for each road segment
- Link steps to specific coordinates in the route geometry

---

## Constructor

```ts
new RouteLegStep(raw: RouteLegStepData)
```

Initializes a `RouteLegStep` with timing and distance data. Throws an error if the raw input is missing.

---

## Methods

| Method           | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `getRaw()`       | Returns the raw `RouteLegStepData` object                 |
| `getDistance()`  | Distance of this step in meters                           |
| `getTime()`      | Travel time in seconds                                    |
| `getFromIndex()` | Index of the start coordinate in the route geometry array |
| `getToIndex()`   | Index of the end coordinate in the route geometry array   |

---

## Example

```ts
const step = new RouteLegStep(data);

console.log("Step duration:", step.getTime());
console.log("From coord index:", step.getFromIndex());
```

Used in combination with the route’s geometry array, this allows you to reconstruct the exact map path followed in each leg.

---

## Related

* [`RouteLeg`](./route-leg.md) – parent object containing a list of steps
* [`AgentSolution`](./agent-solution.md) – contains all route legs and steps
* [`Waypoint`](./waypoint.md) – points connected by legs and steps
