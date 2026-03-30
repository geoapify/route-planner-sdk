# `AgentPlan`

`AgentPlan` represents one agent route in result data.

You usually get it from:

- `RoutePlannerResult.getAgentPlan(agentIdOrIndex)`
- `RoutePlannerResult.getAgentPlans()`

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getRaw` | `getRaw(): AgentPlanData` | Return raw agent plan payload |
| `getAgentIndex` | `getAgentIndex(): number` | Get agent index |
| `getAgentId` | `getAgentId(): string` | Get agent id |
| `getTime` | `getTime(): number` | Get total route time |
| `getStartTime` | `getStartTime(): number` | Get plan start time |
| `getEndTime` | `getEndTime(): number` | Get plan end time |
| `getDistance` | `getDistance(): number` | Get total route distance |
| `getMode` | `getMode(): string` | Get travel mode |
| `getLegs` | `getLegs(): RouteLeg[]` | Get route legs |
| `getActions` | `getActions(): RouteAction[]` | Get all route actions |
| `getDelays` | `getDelays(): RouteAction[]` | Get delay actions only |
| `getWaypoints` | `getWaypoints(): Waypoint[]` | Get route waypoints |
| `getPlannedShipments` | `getPlannedShipments(): number[]` | Get assigned shipment indexes |
| `getPlannedJobs` | `getPlannedJobs(): number[]` | Get assigned job indexes |
| `getAgentInputData` | `getAgentInputData(): AgentData \| undefined` | Get original input agent payload |
| `containsShipment` | `containsShipment(shipmentIdOrIndex: string \| number): boolean` | Check whether shipment is in plan |
| `containsJob` | `containsJob(jobIdOrIndex: string \| number): boolean` | Check whether job is in plan |
| `getViolations` | `getViolations(): Violation[]` | Get validation violations |
| `getRoute` | `getRoute(routingOptions?): Promise<any \| undefined>` | Fetch route geometry from Routing API |

### getRaw()

Returns raw `AgentPlanData`.

```ts
const raw = agentPlan.getRaw();
```

### getAgentIndex()

Returns agent index from input `agents[]`.

```ts
const idx = agentPlan.getAgentIndex();
```

### getAgentId()

Returns agent ID.

```ts
const id = agentPlan.getAgentId();
```

### getTime()

Returns total route time.

```ts
const t = agentPlan.getTime();
```

### getStartTime()

Returns route start time.

```ts
const start = agentPlan.getStartTime();
```

### getEndTime()

Returns route end time.

```ts
const end = agentPlan.getEndTime();
```

### getDistance()

Returns total route distance.

```ts
const dist = agentPlan.getDistance();
```

### getMode()

Returns travel mode.

```ts
const mode = agentPlan.getMode();
```

### getLegs()

Returns all route legs.

```ts
const legs = agentPlan.getLegs();
```

### getActions()

Returns all route actions.

```ts
const actions = agentPlan.getActions();
```

### getDelays()

Returns actions with `type === 'delay'`.

```ts
const delays = agentPlan.getDelays();
```

### getWaypoints()

Returns route waypoints.

```ts
const waypoints = agentPlan.getWaypoints();
```

### getPlannedShipments()

Returns unique shipment indexes present in actions.

```ts
const shipmentIndexes = agentPlan.getPlannedShipments();
```

### getPlannedJobs()

Returns unique job indexes present in actions.

```ts
const jobIndexes = agentPlan.getPlannedJobs();
```

### getAgentInputData()

Returns original `AgentData` from input.

```ts
const inputAgent = agentPlan.getAgentInputData();
```

### containsShipment(shipmentIdOrIndex)

Checks if shipment is present in plan actions.

```ts
const hasShipment = agentPlan.containsShipment('shipment-1');
```

### containsJob(jobIdOrIndex)

Checks if job is present in plan actions.

```ts
const hasJob = agentPlan.containsJob('job-1');
```

### getViolations()

Returns validation violations attached after edits.

```ts
const violations = agentPlan.getViolations();
```

### getRoute(routingOptions?)

Fetches route geometry for current waypoints.

If `routingOptions` is not provided, the method uses routing options from the original
Route Planner input (`result.getRoutingOptions()`).  
If provided, values override those defaults for this route request.

```ts
const routeFeature = await agentPlan.getRoute();

const truckRoute = await agentPlan.getRoute({
  mode: 'truck',
  type: 'less_maneuvers',
  traffic: 'approximated'
});
```

## Routing Options Interfaces

These interfaces are used by `AgentPlan.getRoute(...)`.

### RoutingOptions Interface

```ts
interface RoutingOptions {
  mode?: TravelMode;
  type?: RouteType;
  avoid?: AvoidData[];
  traffic?: TrafficType;
  max_speed?: number;
  units?: DistanceUnitType;
}
```

| Field | Type | Description |
|---|---|---|
| `mode` | `TravelMode` | Travel mode for route calculation. |
| `type` | `RouteType` | Route preference (`balanced`, `short`, `less_maneuvers`). |
| `avoid` | `AvoidData[]` | Avoid rules passed to Routing API. |
| `traffic` | `TrafficType` | Traffic model used in travel time estimation. |
| `max_speed` | `number` | Optional speed cap for route calculation. |
| `units` | `DistanceUnitType` | Output unit system (`metric` or `imperial`). |

### RoutingOptionsExtended Interface

```ts
interface RoutingOptionsExtended extends RoutingOptions {
  lang?: string;
  details?: RouteDetailsType[];
}
```

| Field | Type | Description |
|---|---|---|
| `lang` | `string` | Language for instruction text in route details. |
| `details` | `RouteDetailsType[]` | Extra details to include: `instruction_details`, `route_details`, `elevation`. |

Travel/route-related value sets are listed in
[`RoutePlanner`](./route-planner.md#travel-and-route-types).

## Example

```ts
const result = await planner.plan();
const agentPlan = result.getAgentPlan('agent-1');

if (agentPlan) {
  console.log(agentPlan.getDistance(), agentPlan.getTime());
  console.log(agentPlan.getWaypoints().length);
  console.log(agentPlan.getViolations());
}
```

## AgentPlanData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```ts
interface AgentPlanData {
  agent_index: number;
  agent_id: string;
  time: number;
  start_time: number;
  end_time: number;
  distance: number;
  mode: string;
  legs: RouteLegData[];
  actions: RouteActionData[];
  waypoints: WaypointData[];
}
```

Referenced interfaces:
- [`RouteLegData`](./route-leg.md)
- [`RouteActionData`](./route-action.md)
- [`WaypointData`](./waypoint.md)

## Related

- [`RoutePlannerResult`](./route-planner-result.md)
- [`RoutePlannerResultResponseData Interface`](./route-planner-result.md#routeplannerresultresponsedata-interface)
- [`JobPlan`](./job-plan.md)
- [`ShipmentPlan`](./shipment-plan.md)
- [`Waypoint`](./waypoint.md)
- [`RouteAction`](./route-action.md)
- [`RouteLeg`](./route-leg.md)
