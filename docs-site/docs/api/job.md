# `Job`

`Job` defines a single-stop task (service, delivery, visit) in route planning.

## Constructor

Signature: `new Job(raw?: JobData)`

Creates a job instance. If `raw` is omitted, empty `requirements` and `time_windows` are initialized.

```ts
const job = new Job();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): JobData` | Return current raw payload |
| `setRaw` | `setRaw(value: JobData): this` | Replace raw payload |
| `setId` | `setId(value: string): this` | Set job ID |
| `setDescription` | `setDescription(value: string): this` | Set description |
| `setLocation` | `setLocation(lon: number, lat: number): this` | Set job coordinates |
| `setLocationIndex` | `setLocationIndex(value: number): this` | Set location by index |
| `setPriority` | `setPriority(value: number): this` | Set priority |
| `setDuration` | `setDuration(value: number): this` | Set service duration |
| `setPickupAmount` | `setPickupAmount(value: number): this` | Set pickup amount |
| `setDeliveryAmount` | `setDeliveryAmount(value: number): this` | Set delivery amount |
| `addRequirement` | `addRequirement(value: string): this` | Add required capability |
| `addTimeWindow` | `addTimeWindow(start: number, end: number): this` | Add allowed execution window |

### getRaw()

Returns current `JobData`.

```ts
const raw = job.getRaw();
```

### setRaw(value)

Replaces the whole job payload.

```ts
job.setRaw({ requirements: [], time_windows: [], duration: 300, location: [13.38, 52.52] });
```

### setId(value)

Sets custom job ID.

```ts
job.setId('job-1');
```

### setDescription(value)

Sets human-readable description.

```ts
job.setDescription('Deliver spare parts');
```

### setLocation(lon, lat)

Sets direct coordinates.

```ts
job.setLocation(13.38, 52.52);
```

### setLocationIndex(value)

Sets location by `locations[]` index.

```ts
job.setLocationIndex(2);
```

### setPriority(value)

Sets job priority.

```ts
job.setPriority(80);
```

### setDuration(value)

Sets service time in seconds.

```ts
job.setDuration(300);
```

### setPickupAmount(value)

Sets pickup amount for capacity-constrained scenarios.

```ts
job.setPickupAmount(10);
```

### setDeliveryAmount(value)

Sets delivery amount for capacity-constrained scenarios.

```ts
job.setDeliveryAmount(20);
```

### addRequirement(value)

Adds required capability tag.

```ts
job.addRequirement('fragile');
```

### addTimeWindow(start, end)

Adds allowed execution interval.

```ts
job.addTimeWindow(0, 14400);
```

## Example

```ts
import { Job } from '@geoapify/route-planner-sdk';

const job = new Job()
  .setId('job-1')
  .setDescription('Deliver order #1')
  .setLocation(13.38, 52.52)
  .setDuration(300)
  .addRequirement('fragile')
  .addTimeWindow(0, 14400)
  .setPriority(80);
```

## JobData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface JobData {
  location?: [number, number];
  location_index?: number;
  priority?: number;
  duration?: number;
  pickup_amount?: number;
  delivery_amount?: number;
  requirements: string[];
  time_windows: [number, number][];
  id?: string;
  description?: string;
}
```

## Related

- [`Agent`](./agent.md)
- [`Shipment`](./shipment.md)
- [`Location`](./location.md)
