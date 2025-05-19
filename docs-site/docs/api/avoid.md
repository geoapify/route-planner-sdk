# `Avoid`

The `Avoid` class allows you to define route restrictions for the optimization engine. It is used to specify what the agent should avoid — such as toll roads, highways, or specific coordinates.

This can be helpful when:

- A vehicle cannot use toll roads
- Certain areas are inaccessible or off-limits
- You want to exclude parts of the map due to traffic, regulation, or policy

---

## Purpose

Used within a route planning request to indicate areas or road types that should be avoided during optimization. Each avoid rule has a `type` and one or more `values` depending on the type.

Common types include:

-`"tolls"` – avoid toll roads
- `"highways"` – avoid highways
- `"locations"` – avoid specific locations by coordinates

---

## Constructor

```ts
new Avoid(raw?: AvoidData)
```

Creates a new `Avoid` object. If no data is passed, it initializes an empty avoid configuration with no values.

---

## Methods

| Method               | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `getRaw()`           | Returns the internal `AvoidData` object                            |
| `setRaw(data)`       | Replaces the avoid rule with a new `AvoidData` object              |
| `setType(type)`      | Sets the avoid type (`"tolls"`, `"highways"`, `"locations"`, etc.) |
| `addValue(lon, lat)` | Adds a geographic point to avoid — only for type `"locations"`     |

> Note: `addValue()` should only be used when `type` is set to `"locations"`.

---

## Example

```ts
import { Avoid } from "@geoapify/route-planner-sdk";

const avoid = new Avoid()
  .setType("locations")
  .addValue(13.41, 52.52) // a blocked road
  .addValue(13.37, 52.50); // restricted square
```

This rule tells the route planner to avoid specific geographic points. These are typically used when a driver should not pass through certain zones.

---

## Related

* [`Coordinates`](./coordinates.md) – utility for managing location points
* [`RoutePlanner`](./route-planner.md) – where avoid rules can be passed as input
