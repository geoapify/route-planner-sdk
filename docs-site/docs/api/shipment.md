# `Shipment`

The `Shipment` class defines a delivery that includes both a **pickup** and a **delivery** step. Both steps must be completed by the same agent, and each can have its own location, duration, and time constraints.

Shipments are used when goods must be transported between two points, often with size, skill, or scheduling requirements.

---

## Purpose

Use the `Shipment` class to:

- Define pickup and delivery tasks as one logical unit
- Ensure both steps are assigned to the same agent
- Specify handling or equipment requirements
- Control when each step should happen
- Track priority or quantity for delivery planning

---

## Constructor

```ts
new Shipment(raw?: ShipmentData)
```

Initializes a shipment with an empty `requirements` array if no data is passed.

---

## Methods

### Identification & Description

| Method                 | Description                                 |
| ---------------------- | ------------------------------------------- |
| `setId(id)`            | Assigns a unique identifier to the shipment |
| `setDescription(text)` | Adds an optional human-readable description |

### Steps

| Method                            | Description                                         |
| --------------------------------- | --------------------------------------------------- |
| `setPickup(step: ShipmentStep)`   | Defines the pickup location, timing, and duration   |
| `setDelivery(step: ShipmentStep)` | Defines the delivery location, timing, and duration |

Each step must be an instance of [`ShipmentStep`](./shipment-step.md).

### Constraints

| Method                  | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `addRequirement(value)` | Adds a required agent capability (e.g., `"fragile"`, `"hazmat"`)  |
| `setPriority(value)`    | Sets a priority from 0–100; low-priority shipments may be skipped |
| `setAmount(value)`      | Specifies how much is being shipped (for capacity management)     |

---

## Example

```ts
import { Shipment, ShipmentStep } from "@geoapify/route-planner-sdk";

const pickup = new ShipmentStep()
  .setLocation(13.38, 52.52)
  .setDuration(300)
  .addTimeWindow(0, 14400);

const delivery = new ShipmentStep()
  .setLocation(13.41, 52.50)
  .setDuration(300)
  .addTimeWindow(18000, 32400);

const shipment = new Shipment()
  .setId("delivery-1")
  .setPickup(pickup)
  .setDelivery(delivery)
  .addRequirement("cooled")
  .setAmount(20)
  .setPriority(80);
```

This defines a shipment that must be picked up and delivered within specific time windows, and requires a vehicle capable of handling cooled goods.

---

## Related

* [`ShipmentStep`](./shipment-step.md) – used to define pickup and delivery points
* [`Agent`](./agent.md) – must satisfy all requirements and constraints
* [`Job`](./job.md) – for simpler single-location tasks
* [`Location`](./location.md) – for shared coordinates
