# `Agent`

The `Agent` class represents a resource (driver, vehicle, or field worker) in the Geoapify Route Optimization SDK. It is used to define who can perform jobs and shipments during route planning.

Each agent can have constraints such as start and end location, working time windows, vehicle capacity, and custom capabilities (e.g., refrigerated vehicle, medical skills, etc.).

---

## Purpose

The `Agent` class wraps the raw `AgentData` object and provides a fluent, chainable API to configure all aspects of the agent.

You use this class to:
- Define where an agent starts and ends their route
- Add working time windows and rest breaks
- Assign vehicle or skill capabilities
- Set container capacities for pickups and deliveries

---

## Constructor

```ts
new Agent(raw?: AgentData)
```

Creates a new agent instance. If `raw` is not provided, initializes an empty agent with default empty arrays for capabilities, time windows, and breaks.

---

## Methods

### Basic Configuration

| Method                          | Description                             |
| ------------------------------- | --------------------------------------- |
| `setId(value: string)`          | Assigns a custom agent ID               |
| `setDescription(value: string)` | Adds a human-readable description       |
| `getRaw()`                      | Returns the internal `AgentData` object |
| `setRaw(value: AgentData)`      | Replaces the current agent data         |

---

### Location Setup

| Method                         | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| `setStartLocation(lon, lat)`   | Defines the starting point of the route                              |
| `setStartLocationIndex(index)` | Uses a reusable location from the [`locations`](./location.md) array |
| `setEndLocation(lon, lat)`     | Defines the end point of the route (optional)                        |
| `setEndLocationIndex(index)`   | References a shared end location by index                            |

---

### Capacity

| Method                       | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `setPickupCapacity(value)`   | Max amount of goods the agent can pick up (for bulky shipments) |
| `setDeliveryCapacity(value)` | Max amount of goods the agent can deliver (for bulky shipments) |

---

### Time & Breaks

| Method                      | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `addTimeWindow(start, end)` | Adds an available working interval in relative seconds                      |
| `addBreak(break: Break)`    | Adds a break (with duration and allowed windows); see [`Break`](./break.md) |

Time windows represent when the agent is available to work (e.g. `[[0, 14400], [18000, 32400]]` for 8 hours with a 1-hour lunch).

---

### Capabilities

| Method                 | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `addCapability(value)` | Adds a tag like `'refrigerated'`, `'electric'`, etc. |

Capabilities are matched against [`Job`](./job.md) or [`Shipment`](./shipment.md) requirements.

---

## Example

```ts
import { Agent } from "@geoapify/route-planner-sdk";

const agent = new Agent()
  .setId("van-1")
  .setStartLocation(13.38, 52.52)
  .addCapability("refrigerated")
  .addTimeWindow(0, 28800) // available for 8 hours
  .setPickupCapacity(1000)
  .setDescription("Morning delivery van");
```

This creates an agent ready for planning with location, time, and capacity settings.

---

## Related

* [`Break`](./break.md) – to define rest periods
* [`Job`](./job.md) – tasks that agents can be assigned
* [`Shipment`](./shipment.md) – pickup and delivery pairs
* [`Location`](./location.md) – shared reusable location entries
