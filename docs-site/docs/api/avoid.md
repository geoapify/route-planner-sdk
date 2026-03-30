# `Avoid`

`Avoid` defines routing restrictions for route planning input.

## Constructor

Signature: `new Avoid(raw?: AvoidData)`

Creates an avoid rule. If `raw` is omitted, `values` is initialized as an empty array.

```ts
const avoid = new Avoid();
```

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): AvoidData` | Return current avoid payload |
| `setRaw` | `setRaw(value: AvoidData): this` | Replace avoid payload |
| `setType` | `setType(type: AvoidType): this` | Set avoid type |
| `addValue` | `addValue(lon: number, lat: number): this` | Add avoid coordinate |

### getRaw()

Returns current `AvoidData`.

```ts
const raw = avoid.getRaw();
```

### setRaw(value)

Replaces full avoid payload.

```ts
avoid.setRaw({ type: 'locations', values: [{ lon: 13.41, lat: 52.52 }] });
```

### setType(type)

Sets avoid category (`tolls`, `highways`, `ferries`, `locations`, ...).

```ts
avoid.setType('locations');
```

### addValue(lon, lat)

Adds one coordinate value (typically for `type: 'locations'`).

```ts
avoid.addValue(13.41, 52.52);
```

## Example

```ts
import { Avoid } from '@geoapify/route-planner-sdk';

const avoid = new Avoid()
  .setType('locations')
  .addValue(13.41, 52.52)
  .addValue(13.37, 52.50);
```

## AvoidData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface AvoidData {
  type?: AvoidType;
  importance?: number;
  values: CoordinatesData[];
}
```

Referenced nested interface: [`CoordinatesData`](./coordinates.md#coordinatesdata-interface).

## Related

- [`Coordinates`](./coordinates.md)
- [`RoutePlanner`](./route-planner.md)
