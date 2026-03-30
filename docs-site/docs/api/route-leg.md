# `RouteLeg`

`RouteLeg` represents one travel segment between two waypoints.

## Constructor

Signature: `new RouteLeg(raw: RouteLegData)`

Creates a route leg wrapper around raw leg payload.

```ts
const leg = new RouteLeg(rawLeg);
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): RouteLegData` | Return raw leg payload |
| `getTime` | `getTime(): number` | Get leg travel time |
| `getDistance` | `getDistance(): number` | Get leg distance |
| `getSteps` | `getSteps(): RouteLegStep[]` | Get leg steps |
| `getFromWaypointIndex` | `getFromWaypointIndex(): number` | Get source waypoint index |
| `getToWaypointIndex` | `getToWaypointIndex(): number` | Get destination waypoint index |

### getRaw()

Returns raw `RouteLegData`.

```ts
const raw = leg.getRaw();
```

### getTime()

Returns leg time.

```ts
const time = leg.getTime();
```

### getDistance()

Returns leg distance.

```ts
const distance = leg.getDistance();
```

### getSteps()

Returns all leg steps.

```ts
const steps = leg.getSteps();
```

### getFromWaypointIndex()

Returns source waypoint index.

```ts
const from = leg.getFromWaypointIndex();
```

### getToWaypointIndex()

Returns destination waypoint index.

```ts
const to = leg.getToWaypointIndex();
```

## Example

```ts
const leg = new RouteLeg(data);

console.log(leg.getTime(), leg.getDistance());
console.log(leg.getFromWaypointIndex(), leg.getToWaypointIndex());
```

## RouteLegData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface RouteLegData {
  distance: number;
  time: number;
  steps: RouteLegStepData[];
  from_waypoint_index: number;
  to_waypoint_index: number;
}
```

Referenced nested interface: [`RouteLegStepData`](./route-leg-step.md#routelegstepdata-interface).

## Related

- [`Waypoint`](./waypoint.md)
- [`RouteLegStep`](./route-leg-step.md)
- [`AgentPlan`](./agent-plan.md)
