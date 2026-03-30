# `Coordinates`

`Coordinates` is a small helper class for `{ lat, lon }` payloads.

## Constructor

Signature: `new Coordinates(raw?: CoordinatesData)`

Creates a coordinates object.

```ts
const point = new Coordinates();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): CoordinatesData` | Return current coordinates payload |
| `setRaw` | `setRaw(value: CoordinatesData): this` | Replace coordinates payload |
| `setLat` | `setLat(lat: number): this` | Set latitude |
| `setLon` | `setLon(lon: number): this` | Set longitude |

### getRaw()

Returns current `CoordinatesData`.

```ts
const raw = point.getRaw();
```

### setRaw(value)

Replaces full coordinates payload.

```ts
point.setRaw({ lat: 52.52, lon: 13.38 });
```

### setLat(lat)

Sets latitude.

```ts
point.setLat(52.52);
```

### setLon(lon)

Sets longitude.

```ts
point.setLon(13.38);
```

## Example

```ts
import { Coordinates } from '@geoapify/route-planner-sdk';

const point = new Coordinates().setLat(52.52).setLon(13.38);
```

## CoordinatesData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface CoordinatesData {
  lon?: number;
  lat?: number;
}
```

## Related

- [`Avoid`](./avoid.md)
- [`Location`](./location.md)
