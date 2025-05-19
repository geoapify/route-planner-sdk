# `Job`

The `Job` class defines a single task to be completed by an agent — such as a delivery, service visit, or on-site inspection. It includes location, duration, and scheduling details, along with optional constraints like required skills or priority.

Jobs are the simplest form of work assignment in the route planner. Unlike shipments, jobs involve only one location.

---

## Purpose

Use the `Job` class to define a stop that needs to be visited by an agent. You can set:

- A location (or reference a location index)
- How long the job takes
- Required skills (via `requirements`)
- When it must be done (via `time_windows`)
- Importance (via `priority`)

Jobs can be optional or mandatory depending on how they’re configured.

---

## Constructor

```ts
new Job(raw?: JobData)
```

Initializes a job. If no data is passed, it creates a job with empty `requirements` and `time_windows`.

---

## Methods

### Identification

| Method                  | Description                       |
| ----------------------- | --------------------------------- |
| `setId(value)`          | Sets a unique job ID              |
| `setDescription(value)` | Adds a human-readable description |

### Location

| Method                    | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `setLocation(lon, lat)`   | Sets the job location directly                                 |
| `setLocationIndex(index)` | References a predefined location by index (from `locations[]`) |

### Scheduling

| Method                      | Description                                   |
| --------------------------- | --------------------------------------------- |
| `addTimeWindow(start, end)` | Adds a time window (in relative seconds)      |
| `setDuration(value)`        | Specifies how long the job takes (in seconds) |

### Constraints

| Method                  | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `setPriority(value)`    | Importance from `0` (lowest) to `100` (highest)        |
| `addRequirement(value)` | Adds a skill or capability required to perform the job |

### Capacity (for bulky goods use cases)

| Method                     | Description                                |
| -------------------------- | ------------------------------------------ |
| `setPickupAmount(value)`   | Number of units picked up at this location |
| `setDeliveryAmount(value)` | Number of units delivered at this location |

---

## Example

```ts
import { Job } from "@geoapify/route-planner-sdk";

const job = new Job()
  .setId("order-1")
  .setLocation(13.38, 52.52)
  .setDuration(300) // 5 minutes
  .addTimeWindow(0, 14400)
  .addRequirement("fragile")
  .setPriority(80);
```

This example defines a 5-minute job that must be completed within the first 4 hours of the planning window and requires a vehicle/agent with "fragile" handling capability.

---

## Related

* [`Agent`](./agent.md) – performs the job
* [`Shipment`](./shipment.md) – for jobs that require both pickup and delivery
* [`Location`](./location.md) – for reusable location references

