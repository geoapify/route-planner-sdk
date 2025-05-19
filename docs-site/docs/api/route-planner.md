# `RoutePlanner`

The `RoutePlanner` class is the main interface for sending a route optimization request to the Geoapify Route Planner API. It allows you to build your input incrementally, configure planning options, and submit the request.

Once executed, it returns a structured `RoutePlannerResult` object containing all agent assignments, timelines, and route breakdowns.

---

## Purpose

Use `RoutePlanner` to:

- Build and validate a route planning request
- Add agents, jobs, shipments, and constraints
- Specify travel mode and route options
- Submit the request and receive results in a structured format

---

## Constructor

```ts
new RoutePlanner(options: RoutePlannerOptions, raw?: RoutePlannerInputData)
```

Initializes the planner with configuration and optional raw input. If no base URL is provided, defaults to Geoapify's public API (`https://api.geoapify.com`).

---

## Configuration Methods

| Method                | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `setMode(mode)`       | Sets travel mode (e.g., `drive`, `truck`, etc.)         |
| `setTraffic(traffic)` | Sets traffic model (`free_flow`, `approximated`)        |
| `setType(type)`       | Sets route type (`balanced`, `short`, `less_maneuvers`) |
| `setMaxSpeed(speed)`  | Limits max vehicle speed (in km/h)                      |
| `setUnits(units)`     | Sets unit system (`metric` or `imperial`)               |

---

## Input Data Methods

| Method                  | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `addAgent(agent)`       | Adds an [`Agent`](./agent.md)                    |
| `addJob(job)`           | Adds a [`Job`](./job.md)                         |
| `addShipment(shipment)` | Adds a [`Shipment`](./shipment.md)               |
| `addLocation(location)` | Adds a [`Location`](./location.md) for reference |
| `addAvoid(avoid)`       | Adds an [`Avoid`](./avoid.md) rule               |

These methods allow incremental, chainable setup of the route request.

---

## Request Execution

| Method   | Description                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `plan()` | Submits the request to the Route Planner API and returns a [`RoutePlannerResult`](./route-planner-result.md) |

The `plan()` method automatically serializes the current input, sends a POST request, and returns a structured result object.

---

## Example

```ts
const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" });

const result = await planner
  .setMode("drive")
  .addAgent(new Agent().setId("agent-1").setStartLocation(13.38, 52.52))
  .addJob(new Job().setId("job-1").setLocation(13.39, 52.51))
  .plan();
```

---

## Error Handling

If the API returns an error, the `plan()` method throws a `RoutePlannerError` with detailed information.

---

## Related

* [`RoutePlannerOptions`](./route-planner.md#routeplanneroptions)
* [`RoutePlannerResult`](./route-planner-result.md)
* [`Agent`](./agent.md), [`Job`](./job.md), [`Shipment`](./shipment.md)
* [`Location`](./location.md), [`Avoid`](./avoid.md)
