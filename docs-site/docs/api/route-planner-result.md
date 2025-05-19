# `RoutePlannerResult`

The `RoutePlannerResult` class is the main entry point for working with the output of the Geoapify Route Planner API. It allows you to access planned agent routes, job and shipment assignments, and unassigned tasks.

You can also extract structured timelines, detailed routing actions, and generate enriched visualizations or dashboards using its convenience methods.

---

## Purpose

Use `RoutePlannerResult` to:

- Parse the raw result from the Geoapify Route Planner API
- Access planned agent routes and actions
- Retrieve assignment info for jobs and shipments
- Handle unassigned tasks
- Fetch additional routing details for visualization

---

## Constructor

```ts
new RoutePlannerResult(options: RoutePlannerOptions, rawData: RoutePlannerResultResponseData)
```

Initializes the result handler with routing options and the raw API response.

---

## Core Methods

| Method         | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| `getData()`    | Returns structured planner result (processed via converter) |
| `getRawData()` | Returns the raw JSON from the API response                  |
| `getOptions()` | Returns the `RoutePlannerOptions` used to make the request  |

---

## Agent Routes

| Method                          | Description                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `getAgentSolutions()`           | Returns a list of [`AgentSolution`](./agent-solution.md) for all assigned agents |
| `getAgentSolutionsByIndex()`    | Returns agent solutions in array indexed by input agent list                     |
| `getAgentSolution(agentId)`     | Retrieves a specific agent’s solution                                            |
| `getAgentWaypoints(agentId)`    | Returns that agent’s [`Waypoint`](./waypoint.md)s                                |
| `getAgentRouteActions(agentId)` | Returns that agent’s [`RouteAction`](./route-action.md)s                         |
| `getAgentRouteLegs(agentId)`    | Returns that agent’s [`RouteLeg`](./route-leg.md)s                               |

---

## Assignments

| Method                            | Description                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `getJobSolutions()`               | Returns a list of [`JobSolution`](./job-solution.md)s for all assigned jobs |
| `getJobSolution(jobId)`           | Finds a job solution by its ID                                              |
| `getAgentJobs(agentId)`           | Returns indexes of jobs assigned to an agent                                |
| `getShipmentSolutions()`          | Returns a list of [`ShipmentSolution`](./shipment-solution.md)s             |
| `getShipmentSolution(shipmentId)` | Finds a shipment solution by ID                                             |
| `getAgentShipments(agentId)`      | Returns shipment indexes assigned to the agent                              |

---

## Unassigned Tasks

| Method                     | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `getUnassignedAgents()`    | Returns a list of unassigned `AgentData` entries    |
| `getUnassignedJobs()`      | Returns a list of unassigned `JobData` entries      |
| `getUnassignedShipments()` | Returns a list of unassigned `ShipmentData` entries |

---

## Job & Shipment Info

| Method                        | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `getJobInfo(jobId)`           | Returns [`RouteActionInfo`](./route-action-info.md) for a job (agent, actions, timeline) |
| `getShipmentInfo(shipmentId)` | Returns [`RouteActionInfo`](./route-action-info.md) for a shipment                       |

---

## External Routing Fetch

| Method                            | Description                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `getAgentRoute(agentId, options)` | Fetches enriched routing details using agent waypoints and `RoutingOptions` |



> This triggers an HTTP request and returns additional polyline/route info from Geoapify Routing API.

---

## Example

```ts
const result = new RoutePlannerResult(options, rawResponse);

const agent = result.getAgentSolution("agent-1");
const waypoints = result.getAgentWaypoints("agent-1");

const unassignedJobs = result.getUnassignedJobs();
```

---

## Related

* [`AgentSolution`](./agent-solution.md)
* [`JobSolution`](./job-solution.md)
* [`ShipmentSolution`](./shipment-solution.md)
* [`RouteAction`](./route-action.md)
* [`Waypoint`](./waypoint.md)
* [`RoutingOptions`](./route-planner.md#routingoptions)