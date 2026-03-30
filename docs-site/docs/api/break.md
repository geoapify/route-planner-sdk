# `Break`

`Break` defines an agent break window and duration.

## Constructor

Signature: `new Break(raw?: BreakData)`

Creates a break definition. If `raw` is omitted, empty `time_windows` are initialized.

```ts
const rest = new Break();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): BreakData` | Return current break payload |
| `setRaw` | `setRaw(value: BreakData): this` | Replace break payload |
| `addTimeWindow` | `addTimeWindow(start: number, end: number): this` | Add allowed break interval |
| `setDuration` | `setDuration(duration: number): this` | Set break duration |

### getRaw()

Returns current `BreakData`.

```ts
const raw = rest.getRaw();
```

### setRaw(value)

Replaces full break payload.

```ts
rest.setRaw({ duration: 1800, time_windows: [[14400, 18000]] });
```

### addTimeWindow(start, end)

Adds an allowed break interval (seconds).

```ts
rest.addTimeWindow(14400, 18000);
```

### setDuration(duration)

Sets break duration in seconds.

```ts
rest.setDuration(1800);
```

## Example

```ts
import { Break } from '@geoapify/route-planner-sdk';

const rest = new Break()
  .setDuration(1800)
  .addTimeWindow(14400, 18000)
  .addTimeWindow(28800, 32400);
```

## BreakData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface BreakData {
  duration?: number;
  time_windows: [number, number][];
}
```

## Related

- [`Agent`](./agent.md)
- [`RoutePlanner`](./route-planner.md)
