# `ShipmentStep`

`ShipmentStep` defines one pickup or delivery step used inside `Shipment`.

## Constructor

Signature: `new ShipmentStep(raw?: ShipmentStepData)`

Creates a shipment step. If `raw` is omitted, empty `time_windows` are initialized.

```ts
const step = new ShipmentStep();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): ShipmentStepData` | Return current step payload |
| `setRaw` | `setRaw(value: ShipmentStepData): this` | Replace step payload |
| `setLocation` | `setLocation(lon: number, lat: number): this` | Set coordinates |
| `setLocationIndex` | `setLocationIndex(value: number): this` | Set location by index |
| `setDuration` | `setDuration(value: number): this` | Set step duration |
| `addTimeWindow` | `addTimeWindow(start: number, end: number): this` | Add allowed execution window |

### getRaw()

Returns current `ShipmentStepData`.

```ts
const raw = step.getRaw();
```

### setRaw(value)

Replaces full step payload.

```ts
step.setRaw({ location: [13.38, 52.52], duration: 180, time_windows: [[0, 14400]] });
```

### setLocation(lon, lat)

Sets direct coordinates.

```ts
step.setLocation(13.38, 52.52);
```

### setLocationIndex(value)

Sets location by `locations[]` index.

```ts
step.setLocationIndex(0);
```

### setDuration(value)

Sets duration in seconds.

```ts
step.setDuration(180);
```

### addTimeWindow(start, end)

Adds one allowed interval.

```ts
step.addTimeWindow(0, 14400);
```

## Example

```ts
import { ShipmentStep } from '@geoapify/route-planner-sdk';

const pickup = new ShipmentStep()
  .setLocation(13.38, 52.52)
  .setDuration(180)
  .addTimeWindow(0, 14400);
```

## ShipmentStepData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface ShipmentStepData {
  location?: [number, number];
  location_index?: number;
  duration?: number;
  time_windows: [number, number][];
}
```

## Related

- [`Shipment`](./shipment.md)
- [`Location`](./location.md)
