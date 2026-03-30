# `Agent`

`Agent` defines a worker/vehicle that can execute jobs and shipments.

## Constructor

Signature: `new Agent(raw?: AgentData)`

Creates an agent instance. If `raw` is omitted, empty arrays for `capabilities`, `time_windows`, and `breaks` are initialized.

```ts
const agent = new Agent();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): AgentData` | Return current raw payload |
| `setRaw` | `setRaw(value: AgentData): this` | Replace raw payload |
| `setId` | `setId(value: string): this` | Set agent ID |
| `setDescription` | `setDescription(value: string): this` | Set description |
| `setStartLocation` | `setStartLocation(lon: number, lat: number): this` | Set start coordinates |
| `setStartLocationIndex` | `setStartLocationIndex(value: number): this` | Set start location index |
| `setEndLocation` | `setEndLocation(lon: number, lat: number): this` | Set end coordinates |
| `setEndLocationIndex` | `setEndLocationIndex(value: number): this` | Set end location index |
| `setPickupCapacity` | `setPickupCapacity(value: number): this` | Set pickup capacity |
| `setDeliveryCapacity` | `setDeliveryCapacity(value: number): this` | Set delivery capacity |
| `addCapability` | `addCapability(value: string): this` | Add required capability tag |
| `addTimeWindow` | `addTimeWindow(start: number, end: number): this` | Add availability window |
| `addBreak` | `addBreak(value: Break): this` | Add break window/duration |

### getRaw()

Returns current `AgentData`.

```ts
const raw = agent.getRaw();
```

### setRaw(value)

Replaces the whole agent payload.

```ts
agent.setRaw({ id: 'agent-1', capabilities: [], time_windows: [], breaks: [] });
```

### setId(value)

Sets a custom agent ID.

```ts
agent.setId('agent-1');
```

### setDescription(value)

Sets human-readable description.

```ts
agent.setDescription('North zone van');
```

### setStartLocation(lon, lat)

Sets start location coordinates.

```ts
agent.setStartLocation(13.38, 52.52);
```

### setStartLocationIndex(value)

Sets start location by `locations[]` index.

```ts
agent.setStartLocationIndex(0);
```

### setEndLocation(lon, lat)

Sets end location coordinates.

```ts
agent.setEndLocation(13.41, 52.51);
```

### setEndLocationIndex(value)

Sets end location by `locations[]` index.

```ts
agent.setEndLocationIndex(1);
```

### setPickupCapacity(value)

Sets max pickup amount.

```ts
agent.setPickupCapacity(1000);
```

### setDeliveryCapacity(value)

Sets max delivery amount.

```ts
agent.setDeliveryCapacity(1500);
```

### addCapability(value)

Adds one capability tag.

```ts
agent.addCapability('refrigerated');
```

### addTimeWindow(start, end)

Adds one availability interval in seconds.

```ts
agent.addTimeWindow(0, 28800);
```

### addBreak(value)

Adds one break definition.

```ts
agent.addBreak(new Break().setDuration(1800).addTimeWindow(14400, 18000));
```

## Example

```ts
import { Agent, Break } from '@geoapify/route-planner-sdk';

const agent = new Agent()
  .setId('agent-1')
  .setStartLocation(13.38, 52.52)
  .setEndLocation(13.40, 52.50)
  .setPickupCapacity(1000)
  .setDeliveryCapacity(1000)
  .addCapability('refrigerated')
  .addTimeWindow(0, 28800)
  .addBreak(new Break().setDuration(1800).addTimeWindow(14400, 18000));
```

## AgentData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface AgentData {
  start_location?: [number, number];
  start_location_index?: number;
  end_location?: [number, number];
  end_location_index?: number;
  pickup_capacity?: number;
  delivery_capacity?: number;
  capabilities: string[];
  time_windows: [number, number][];
  breaks: BreakData[];
  id?: string;
  description?: string;
}
```

Referenced nested interface: [`BreakData`](./break.md#breakdata-interface).

## Related

- [`Break`](./break.md)
- [`Job`](./job.md)
- [`Shipment`](./shipment.md)
- [`Location`](./location.md)
