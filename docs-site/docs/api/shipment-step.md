# `ShipmentStep`

The `ShipmentStep` class defines a single leg of a shipment — either the **pickup** or **delivery** step. It's used within the `Shipment` class to configure each location and its constraints independently.

Each step includes its own location, time windows, and duration, allowing for detailed control over when and how goods are picked up or delivered.

---

## Purpose

Use `ShipmentStep` to:

- Define the pickup or delivery part of a shipment
- Control time constraints per step (e.g., pickup must happen before noon)
- Set how long the step will take
- Reference a reusable location or provide exact coordinates

---

## Constructor

```ts
new ShipmentStep(raw?: ShipmentStepData)
```

Initializes a new shipment step. If no raw data is provided, creates a step with an empty list of time windows.

---

## Methods

| Method                      | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `getRaw()`                  | Returns the internal `ShipmentStepData` object                 |
| `setRaw(data)`              | Replaces the entire shipment step configuration                |
| `setLocation(lon, lat)`     | Sets the step's exact coordinates                              |
| `setLocationIndex(index)`   | References a predefined location by index                      |
| `setDuration(seconds)`      | Sets how long the step takes (e.g., loading/unloading time)    |
| `addTimeWindow(start, end)` | Adds a time window when this step can be executed (in seconds) |

---

## Example

```ts
import { ShipmentStep } from "@geoapify/route-planner-sdk";

const pickup = new ShipmentStep()
  .setLocation(13.38, 52.52)
  .setDuration(180) // 3 minutes
  .addTimeWindow(0, 14400); // must happen in the first 4 hours
```

This creates a shipment pickup that takes 3 minutes and must be completed within a specified window.

---

## Related

* [`Shipment`](./shipment.md) – combines a pickup and delivery step into one logical task
* [`Location`](./location.md) – step locations can be reused via index
* [`Agent`](./agent.md) – agents execute these steps as part of their planned route