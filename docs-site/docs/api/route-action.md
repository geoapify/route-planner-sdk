# `RouteAction`

`RouteAction` represents one action in an agent route timeline.

## Constructor

Signature: `new RouteAction(raw: RouteActionData)`

Creates a route action wrapper around raw action payload.

```ts
const action = new RouteAction(rawAction);
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): RouteActionData` | Return raw action payload |
| `getType` | `getType(): string` | Get action type |
| `getStartTime` | `getStartTime(): number` | Get start time |
| `getDuration` | `getDuration(): number` | Get action duration |
| `getShipmentIndex` | `getShipmentIndex(): number \| undefined` | Get shipment index |
| `getShipmentId` | `getShipmentId(): string \| undefined` | Get shipment id |
| `getLocationIndex` | `getLocationIndex(): number \| undefined` | Get location index |
| `getLocationId` | `getLocationId(): string \| undefined` | Get location id |
| `getJobIndex` | `getJobIndex(): number \| undefined` | Get job index |
| `getJobId` | `getJobId(): string \| undefined` | Get job id |
| `getActionIndex` | `getActionIndex(): number` | Get action order index |
| `getWaypointIndex` | `getWaypointIndex(): number \| undefined` | Get waypoint index |

### getRaw()

Returns raw `RouteActionData`.

```ts
const raw = action.getRaw();
```

### getType()

Returns action type (`start`, `job`, `pickup`, `delivery`, `break`, `delay`, `end`, ...).

```ts
const type = action.getType();
```

### getStartTime()

Returns action start time.

```ts
const start = action.getStartTime();
```

### getDuration()

Returns action duration.

```ts
const duration = action.getDuration();
```

### getShipmentIndex()

Returns shipment index if action belongs to a shipment.

```ts
const shipmentIndex = action.getShipmentIndex();
```

### getShipmentId()

Returns shipment ID if present.

```ts
const shipmentId = action.getShipmentId();
```

### getLocationIndex()

Returns referenced location index if present.

```ts
const locIndex = action.getLocationIndex();
```

### getLocationId()

Returns referenced location ID if present.

```ts
const locId = action.getLocationId();
```

### getJobIndex()

Returns job index if action belongs to a job.

```ts
const jobIndex = action.getJobIndex();
```

### getJobId()

Returns job ID if present.

```ts
const jobId = action.getJobId();
```

### getActionIndex()

Returns global action index in agent action list.

```ts
const idx = action.getActionIndex();
```

### getWaypointIndex()

Returns waypoint index linked to this action.

```ts
const wpIndex = action.getWaypointIndex();
```

## Example

```ts
const action = new RouteAction(data);

console.log(action.getType());
console.log(action.getStartTime());
console.log(action.getDuration());
```

## RouteActionData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface RouteActionData {
  type: string;
  start_time: number;
  duration: number;
  index: number;
  shipment_index?: number;
  shipment_id?: string;
  location_index?: number;
  location_id?: string;
  job_index?: number;
  job_id?: string;
  waypoint_index?: number;
}
```

## Related

- [`AgentPlan`](./agent-plan.md)
- [`JobPlan`](./job-plan.md)
- [`Waypoint`](./waypoint.md)
