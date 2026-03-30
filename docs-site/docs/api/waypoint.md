# `Waypoint`

`Waypoint` represents one route stop where one or more actions are executed.

## Constructor

Signature: `new Waypoint(raw: WaypointData)`

Creates a waypoint wrapper around raw waypoint payload.

```ts
const waypoint = new Waypoint(rawWaypoint);
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): WaypointData` | Return raw waypoint payload |
| `getOriginalLocation` | `getOriginalLocation(): [number, number]` | Get original input coordinates |
| `getOriginalLocationIndex` | `getOriginalLocationIndex(): number \| undefined` | Get original location index |
| `getOriginalLocationId` | `getOriginalLocationId(): string \| undefined` | Get original location id |
| `getLocation` | `getLocation(): [number, number]` | Get effective route location |
| `getStartTime` | `getStartTime(): number` | Get waypoint start time |
| `getDuration` | `getDuration(): number` | Get total waypoint duration |
| `getActions` | `getActions(): RouteAction[]` | Get actions at this waypoint |
| `getPrevLegIndex` | `getPrevLegIndex(): number \| undefined` | Get previous leg index |
| `getNextLegIndex` | `getNextLegIndex(): number \| undefined` | Get next leg index |

### getRaw()

Returns raw `WaypointData`.

```ts
const raw = waypoint.getRaw();
```

### getOriginalLocation()

Returns original input location coordinates.

```ts
const original = waypoint.getOriginalLocation();
```

### getOriginalLocationIndex()

Returns original input location index if present.

```ts
const idx = waypoint.getOriginalLocationIndex();
```

### getOriginalLocationId()

Returns original input location ID if present.

```ts
const id = waypoint.getOriginalLocationId();
```

### getLocation()

Returns effective (possibly snapped/adjusted) route location.

```ts
const location = waypoint.getLocation();
```

### getStartTime()

Returns waypoint start time.

```ts
const start = waypoint.getStartTime();
```

### getDuration()

Returns total waypoint duration.

```ts
const duration = waypoint.getDuration();
```

### getActions()

Returns actions attached to this waypoint.

```ts
const actions = waypoint.getActions();
```

### getPrevLegIndex()

Returns previous leg index.

```ts
const prev = waypoint.getPrevLegIndex();
```

### getNextLegIndex()

Returns next leg index.

```ts
const next = waypoint.getNextLegIndex();
```

## Example

```ts
const waypoint = new Waypoint(data);

console.log(waypoint.getStartTime());
console.log(waypoint.getActions().map((a) => a.getType()));
```

## WaypointData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface WaypointData {
  original_location: [number, number];
  original_location_index?: number;
  original_location_id?: string;
  location?: [number, number];
  start_time: number;
  duration: number;
  actions: RouteActionData[];
  prev_leg_index?: number;
  next_leg_index?: number;
}
```

Referenced nested interface: [`RouteActionData`](./route-action.md#routeactiondata-interface).

## Related

- [`RouteAction`](./route-action.md)
- [`AgentPlan`](./agent-plan.md)
- [`RouteLeg`](./route-leg.md)
