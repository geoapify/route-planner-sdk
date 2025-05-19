# `Coordinates`

The `Coordinates` class is a simple utility used to represent a geographic point. It holds a latitude and longitude and is used throughout the SDK to define locations — for agents, jobs, shipments, or areas to avoid.

---

## Purpose

`Coordinates` is most often used to:

- Define points in `Avoid`, `Location`, or raw input structures
- Construct reusable location references
- Store `[latitude, longitude]` pairs in a typed, fluent format

---

## Constructor

```ts
new Coordinates(raw?: CoordinatesData)
```

Creates a new coordinate object. If no `raw` data is passed, initializes an empty object.

---

## Methods

| Method         | Description                                     |
| -------------- | ----------------------------------------------- |
| `getRaw()`     | Returns the underlying `CoordinatesData` object |
| `setRaw(data)` | Replaces the entire coordinates structure       |
| `setLat(lat)`  | Sets the latitude value                         |
| `setLon(lon)`  | Sets the longitude value                        |

> Note: Both latitude and longitude must be defined for a valid location.

---

## Example

```ts
import { Coordinates } from "@geoapify/route-planner-sdk";

const point = new Coordinates()
  .setLat(52.52)
  .setLon(13.38);

console.log(point.getRaw());
// { lat: 52.52, lon: 13.38 }
```

---

## Related

* [`Avoid`](./avoid.md) – uses `Coordinates` to define exclusion zones
* [`Location`](./location.md) – a reusable location in planning input
* [`Agent`](./agent.md) – may define start/end locations using coordinates

```