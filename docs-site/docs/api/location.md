# `Location`

The `Location` class defines a reusable geographic location used in route planning. Instead of specifying coordinates directly in agents, jobs, or shipments, you can use `Location` objects to centralize and reference shared coordinates.

This helps reduce duplication and makes the input cleaner and easier to maintain — especially for locations like warehouses, stores, or repeated delivery points.

---

## Purpose

Use `Location` when:

- You want to define a set of shared coordinates once and reuse them
- You need to assign start/end points or job locations by index (e.g., `start_location_index`)
- You want to manage a list of known locations with unique identifiers

These locations are referenced via indexes in the `locations[]` array in your API request.

---

## Constructor

```ts
new Location(raw?: LocationData)
```

Initializes a new location. If no raw data is passed, creates an empty structure.

---

## Methods

| Method                  | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `getRaw()`              | Returns the internal `LocationData` object              |
| `setRaw(data)`          | Replaces the entire location definition                 |
| `setId(id)`             | Assigns a unique identifier for the location (optional) |
| `setLocation(lon, lat)` | Sets the geographic coordinates                         |

---

## Example

```ts
import { Location } from "@geoapify/route-planner-sdk";

const warehouse = new Location()
  .setId("warehouse-1")
  .setLocation(13.38, 52.52);
```

You can then reference this location by its index in the `locations[]` array when configuring an agent or shipment.

---

## Related

* [`Agent`](./agent.md) – can use start or end location indexes
* [`Job`](./job.md) – can reference a location via index
* [`Shipment`](./shipment.md) – pickup and delivery can use indexed locations