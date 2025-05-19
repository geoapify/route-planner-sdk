# Entities & Concepts

The Geoapify Route Optimization SDK is a high-level interface to the [Geoapify Route Planner API](https://www.geoapify.com/route-planner-api/). It allows you to solve logistics problems like multi-agent delivery, pickup/drop-off routing, and scheduling under constraints (e.g., working hours, priorities, traffic).

This page explains the **core concepts and entities** used by the SDK and API — not just as field definitions, but how they interact during route planning.

## How the Route Planning Works

At a high level, route optimization is about finding the best way for a set of **agents** (e.g., drivers) to complete a set of **jobs** or **shipments** given constraints like working hours, traffic, and capacity.

Here's a simplified flow:

```
+--------------------+      +----------------+       +---------------------+
|  Agent definitions | ---> | Optimization   | --->  | Optimized routes    |
|  Job/Shipment list |      | Engine (API)   |       | per agent, with     |
|  Constraints       |      |                |       | timings & order     |
+--------------------+      +----------------+       +---------------------+
```

You define:

* **Who is available?** → agents
* **What needs to be done?** → jobs or shipments
* **When and how?** → time windows, traffic, routing mode

The system returns optimized plans for each agent.

## Core Concepts

### Agents

Agents represent mobile resources: vehicles, drivers, couriers, field workers. Each agent can:

* Have a **start and optional end location** (e.g., warehouse)
* Be **available only at certain times** (e.g., 8am–5pm)
* Take **breaks** during the day
* Carry specific **tools** or have certain **skills** (via `capabilities`)
* Have limits on **what or how much they can carry** (e.g., `pickup_capacity`)

> Each agent will be assigned a custom route that fits within these constraints.

### Jobs

Jobs are simple one-stop tasks, such as deliveries or field visits. A job can:

* Be located at a single point
* Have **service time** (how long it takes to complete)
* Be **time-constrained** (e.g., only from 2pm to 4pm)
* Require certain **skills** (e.g., "fragile handling")
* Have **priority**, so lower-priority jobs may be skipped if time is tight

> Jobs are assigned to agents who can serve them, based on location, time, and capabilities.

### Shipments

Shipments represent **pickup and delivery pairs** — a pickup happens at one location, and a delivery at another.

* Each shipment has a unique ID
* Pickup and delivery can have separate time windows
* Both steps belong to the same shipment and must be assigned to one agent
* Can specify **amount** of goods, and **requirements**

> Useful for logistics with backhauls or parcel delivery.

### Locations

To avoid repeating coordinates, you can define shared locations in a list and reference them by index in agents, jobs, and shipments.

> Improves efficiency and keeps payloads smaller.

### Time Windows

Time windows are used to define when agents, jobs, or shipments are allowed to operate. They are expressed as intervals in relative seconds from the start of the planning task.

```
[[0, 3600]] // Available the first hour only
[[0, 14400], [18000, 32400]] // 8-hour workday with 1-hour lunch break
```

This format is shared across:

* **Agents**: to define working hours
* **Jobs**: to indicate when a service must occur
* **Shipments**: to constrain pickup and delivery timeframes
* **Breaks**: to specify acceptable timeframes for taking a rest from the start of planning. You can apply them to agents, jobs, or breaks.

### Constraints

Constraints let you customize route planning:

* **Routing mode**: e.g., `drive`, `bike`, `truck`
* **Traffic model**: `free_flow` (default), or `approximated`
* **Route type**: shortest, balanced, fewer turns
* **Max speed**: optional per-agent speed cap
* **Avoids**: road types (e.g., no tolls)

## Putting It Together

When you call the API or use the SDK, you combine all the above into a planning request.

```ts
const planner = new RoutePlanner({ apiKey });

const result = await planner
  .setMode("drive")
  .addAgent(...)
  .addJob(...)
  .plan();
```

The SDK wraps the API call, handles validation, and returns a `RoutePlannerResult` — which you can use as-is or modify using tools like `RoutePlannerResultEditor` and visualize with `RoutePlannerTimeline`.

---

For details on how to format each object (Agent, Job, Shipment, etc.), see the [API Reference](./api/index.md).

Try it in the [Playground](https://apidocs.geoapify.com/playground/route-planner/).
