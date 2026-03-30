# `RouteLegStep`

`RouteLegStep` represents one low-level travel step within a leg.

## Constructor

Signature: `new RouteLegStep(raw: RouteLegStepData)`

Creates a step wrapper around raw leg-step payload.

```ts
const step = new RouteLegStep(rawStep);
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): RouteLegStepData` | Return raw step payload |
| `getDistance` | `getDistance(): number` | Get step distance |
| `getTime` | `getTime(): number` | Get step travel time |
| `getFromIndex` | `getFromIndex(): number` | Get source geometry index |
| `getToIndex` | `getToIndex(): number` | Get destination geometry index |

### getRaw()

Returns raw `RouteLegStepData`.

```ts
const raw = step.getRaw();
```

### getDistance()

Returns step distance.

```ts
const distance = step.getDistance();
```

### getTime()

Returns step time.

```ts
const time = step.getTime();
```

### getFromIndex()

Returns source geometry index.

```ts
const from = step.getFromIndex();
```

### getToIndex()

Returns destination geometry index.

```ts
const to = step.getToIndex();
```

## Example

```ts
const step = new RouteLegStep(data);

console.log(step.getTime(), step.getDistance());
console.log(step.getFromIndex(), step.getToIndex());
```

## RouteLegStepData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface RouteLegStepData {
  distance: number;
  time: number;
  from_index: number;
  to_index: number;
}
```

## Related

- [`RouteLeg`](./route-leg.md)
- [`AgentPlan`](./agent-plan.md)
