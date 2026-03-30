# `Location`

`Location` defines a reusable place in `locations[]` input.

## Constructor

Signature: `new Location(raw?: LocationData)`

Creates a location payload.

```ts
const location = new Location();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): LocationData` | Return current location payload |
| `setRaw` | `setRaw(value: LocationData): this` | Replace location payload |
| `setId` | `setId(id: string): this` | Set location ID |
| `setLocation` | `setLocation(lon: number, lat: number): this` | Set coordinates |

### getRaw()

Returns current `LocationData`.

```ts
const raw = location.getRaw();
```

### setRaw(value)

Replaces full location payload.

```ts
location.setRaw({ id: 'warehouse-1', location: [13.38, 52.52] });
```

### setId(id)

Sets location ID.

```ts
location.setId('warehouse-1');
```

### setLocation(lon, lat)

Sets location coordinates.

```ts
location.setLocation(13.38, 52.52);
```

## Example

```ts
import { Location } from '@geoapify/route-planner-sdk';

const warehouse = new Location()
  .setId('warehouse-1')
  .setLocation(13.38, 52.52);
```

## LocationData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface LocationData {
  id?: string;
  location?: [number, number];
}
```

## Related

- [`Agent`](./agent.md)
- [`Job`](./job.md)
- [`ShipmentStep`](./shipment-step.md)
