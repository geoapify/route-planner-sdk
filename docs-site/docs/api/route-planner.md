# RoutePlanner

This page documents the `RoutePlanner` class from the `@geoapify/route-planner-sdk` library — including setup, configuration, and all available methods.
Use it to **build and execute route optimization requests** to the Geoapify Route Planner API, combining agents, jobs, shipments, and constraints into an optimal plan.
`RoutePlanner` is also a convenient builder for creating valid Route Planner API input (`RoutePlannerInputData`) before sending it.

## Creating RoutePlanner Input

You can create a planner in two ways:

1. Build input incrementally with SDK methods (`setMode`, `addAgent`, `addJob`, `addShipment`, and so on).
2. Initialize directly from an existing Route Planner API input JSON object (`RoutePlannerInputData`).

This is useful when your app:

- builds requests in UI forms (method-based approach), or
- already stores/receives API request payloads as JSON (raw-object approach).

### Method-based creation

```typescript
import { RoutePlanner, Agent, Job } from '@geoapify/route-planner-sdk';

const planner = new RoutePlanner({ apiKey: 'YOUR_API_KEY' });

planner
  .setMode('drive')
  .addAgent(new Agent().setId('agent-1').setStartLocation(13.38, 52.52))
  .addJob(new Job().setId('job-1').setLocation(13.39, 52.51));
```

### JSON-based creation (Route Planner API input object)

```typescript
import { RoutePlanner } from '@geoapify/route-planner-sdk';

const input = {
  mode: 'drive',
  agents: [{ id: 'agent-1', start_location: [13.38, 52.52] }],
  jobs: [{ id: 'job-1', location: [13.39, 52.51], duration: 300 }],
  shipments: [],
  locations: [],
  avoid: []
};

const planner = new RoutePlanner({ apiKey: 'YOUR_API_KEY' }, input);
```

You can also replace data later with [`setRaw()`](#setraw).

## Constructor

```typescript
constructor(options: RoutePlannerCallOptions, raw?: RoutePlannerInputData)
```

Creates a new **RoutePlanner** instance and optionally initializes it with raw input data.

Here are the parameters you can pass to the constructor:

| Name | Type | Description |
|------|------|-------------|
| `options` | [`RoutePlannerCallOptions`](#routeplannercalloptions-interface) | Configuration object containing API key |
| `raw` | [`RoutePlannerInputData`](#routeplannerinputdata-interface) *(optional)* | Pre-built input data to use instead of building incrementally |

Here's a basic example of how to initialize and use the planner:

```typescript
import RoutePlanner, { Agent, Job } from '@geoapify/route-planner-sdk';

const planner = new RoutePlanner({ apiKey: 'YOUR_API_KEY' });

const result = await planner
  .setMode('drive')
  .addAgent(new Agent().setId('agent-1').setStartLocation(13.38, 52.52))
  .addJob(new Job().setId('job-1').setLocation(13.39, 52.51))
  .plan();
```


## Methods

The `RoutePlanner` class provides methods for configuration, adding input data, and executing requests. All setter methods return `this` for chaining.

| Method | Signature | Purpose |
|--------|-----------|---------|
| [`setMode`](#setmode) | `setMode(mode: TravelMode): this` | Set travel mode (drive, truck, etc.) |
| [`setTraffic`](#settraffic) | `setTraffic(traffic: TrafficType): this` | Set traffic model |
| [`setType`](#settype) | `setType(type: RouteType): this` | Set route optimization type |
| [`setMaxSpeed`](#setmaxspeed) | `setMaxSpeed(speed: number): this` | Limit maximum vehicle speed |
| [`setUnits`](#setunits) | `setUnits(units: DistanceUnitType): this` | Set measurement units |
| [`addAgent`](#addagent) | `addAgent(agent: Agent): this` | Add an agent to the plan |
| [`addJob`](#addjob) | `addJob(job: Job): this` | Add a job to the plan |
| [`addShipment`](#addshipment) | `addShipment(shipment: Shipment): this` | Add a shipment to the plan |
| [`addLocation`](#addlocation) | `addLocation(location: Location): this` | Add a reusable location |
| [`addAvoid`](#addavoid) | `addAvoid(avoid: Avoid): this` | Add a travel restriction |
| [`getRaw`](#getraw) | `getRaw(): RoutePlannerInputData` | Get current input data |
| [`setRaw`](#setraw) | `setRaw(raw: RoutePlannerInputData): this` | Set raw input data directly |
| [`plan`](#plan) | `plan(): Promise<RoutePlannerResult>` | Execute the optimization request |

Here's the detailed version of method descriptions:

### setMode()

Signature: `setMode(mode: TravelMode): this`

Sets the travel mode for route calculation. This determines how travel times and distances are computed.

**Type:** `TravelMode` — `'drive'` | `'truck'` | `'scooter'` | `'bicycle'` | `'walk'` | `'transit'`

**Example:**

```typescript
planner.setMode('drive');
planner.setMode('truck'); // For heavy vehicles with road restrictions
```

### setTraffic()

Signature: `setTraffic(traffic: TrafficType): this`

Sets the traffic model used for travel time estimation.

**Type:** `TrafficType` — `'free_flow'` | `'approximated'`

**Example:**

```typescript
planner.setTraffic('free_flow');      // Ideal conditions
planner.setTraffic('approximated');   // Typical traffic patterns
```

### setType()

Signature: `setType(type: RouteType): this`

Sets the route optimization preference.

**Type:** `RouteType` — `'balanced'` | `'short'` | `'less_maneuvers'`

**Example:**

```typescript
planner.setType('balanced');       // Balance time and distance
planner.setType('short');          // Shortest distance
planner.setType('less_maneuvers'); // Fewer turns and lane changes
```

### setMaxSpeed()

Signature: `setMaxSpeed(speed: number): this`

Limits the maximum vehicle speed in km/h. Useful for company policies or vehicle restrictions.

**Example:**

```typescript
planner.setMaxSpeed(80); // Max 80 km/h
```

### setUnits()

Signature: `setUnits(units: DistanceUnitType): this`

Sets the unit system for distances in the response.

**Type:** `DistanceUnitType` — `'metric'` | `'imperial'`

**Example:**

```typescript
planner.setUnits('metric');   // Kilometers
planner.setUnits('imperial'); // Miles
```

### addAgent()

Signature: `addAgent(agent: Agent): this`

Adds an agent (driver, vehicle, worker) to the route plan. Agents perform jobs and shipments.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agent` | [`Agent`](./agent.md) | The agent to add |

**Example:**

```typescript
const agent = new Agent()
  .setId('driver-1')
  .setStartLocation(13.38, 52.52)
  .setEndLocation(13.38, 52.52)
  .addTimeWindow(0, 28800); // 8-hour shift

planner.addAgent(agent);
```

### addJob()

Signature: `addJob(job: Job): this`

Adds a job (single-location task) to the route plan.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `job` | [`Job`](./job.md) | The job to add |

**Example:**

```typescript
const job = new Job()
  .setId('delivery-1')
  .setLocation(13.39, 52.51)
  .setDuration(300)
  .addRequirement('refrigerated');

planner.addJob(job);
```

### addShipment()

Signature: `addShipment(shipment: Shipment): this`

Adds a shipment (pickup + delivery pair) to the route plan.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `shipment` | [`Shipment`](./shipment.md) | The shipment to add |

**Example:**

```typescript
const shipment = new Shipment()
  .setId('order-1')
  .setPickup(new ShipmentStep().setLocation(13.38, 52.52).setDuration(120))
  .setDelivery(new ShipmentStep().setLocation(13.42, 52.50).setDuration(120));

planner.addShipment(shipment);
```

### addLocation()

Signature: `addLocation(location: Location): this`

Adds a reusable named location that can be referenced by index in agents, jobs, or shipments.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `location` | [`Location`](./location.md) | The location to add |

**Example:**

```typescript
const warehouse = new Location()
  .setId('warehouse-main')
  .setLocation(13.38, 52.52);

planner.addLocation(warehouse);

// Reference by index
const agent = new Agent()
  .setStartLocationIndex(0); // Uses warehouse-main
```

### addAvoid()

Signature: `addAvoid(avoid: Avoid): this`

Adds a travel restriction to avoid certain road types or areas.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `avoid` | [`Avoid`](./avoid.md) | The avoidance rule to add |

**Example:**

```typescript
const avoidTolls = new Avoid().setType('tolls');
const avoidHighways = new Avoid().setType('highways');

planner.addAvoid(avoidTolls).addAvoid(avoidHighways);
```

### getRaw()

Signature: `getRaw(): RoutePlannerInputData`

Returns the current input data. Useful for inspecting or serializing the current state before planning.

**Example:**

```typescript
const currentInput = planner.getRaw();
console.log(currentInput.agents.length); // Check how many agents
```

### setRaw()

Signature: `setRaw(raw: RoutePlannerInputData): this`

Sets the complete input data directly instead of building incrementally. Useful when you have pre-built request data.

**Example:**

```typescript
const rawData = {
  mode: 'drive',
  agents: [{ start_location: [13.38, 52.52] }],
  jobs: [{ location: [13.39, 52.51], duration: 300 }]
};

planner.setRaw(rawData);
```

### plan()

Signature: `plan(): Promise<RoutePlannerResult>`

Executes the route optimization request and returns the result. This method sends the data to the Geoapify Route Planner API.

**Returns:** `Promise<RoutePlannerResult>` — The optimized route plan

**Example:**

```typescript
const result = await planner.plan();

// Access results
const agents = result.getAgentPlans();
const unassignedJobs = result.getUnassignedJobs();
```

## Error Handling

If the API returns an error, the `plan()` method throws a `RoutePlannerError` with detailed information:

```typescript
try {
  const result = await planner.plan();
} catch (error) {
  if (error instanceof RoutePlannerError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
  }
}
```

## Complete Example

```typescript
import RoutePlanner, { Agent, Job, Shipment, ShipmentStep } from '@geoapify/route-planner-sdk';

const planner = new RoutePlanner({ apiKey: 'YOUR_API_KEY' });

// Configure
planner
  .setMode('drive')
  .setTraffic('approximated')
  .setUnits('metric');

// Add agents
planner
  .addAgent(
    new Agent()
      .setId('van-1')
      .setStartLocation(13.38, 52.52)
      .addTimeWindow(0, 28800)
      .addCapability('refrigerated')
  )
  .addAgent(
    new Agent()
      .setId('van-2')
      .setStartLocation(13.40, 52.50)
      .addTimeWindow(0, 28800)
  );

// Add jobs
planner
  .addJob(new Job().setId('job-1').setLocation(13.39, 52.51).setDuration(300))
  .addJob(new Job().setId('job-2').setLocation(13.41, 52.49).setDuration(600));

// Execute
const result = await planner.plan();

// Process results
result.getAgentPlans().forEach(agent => {
  if (!agent) return;
  console.log(`Agent ${agent.getAgentId()}: ${agent.getDistance()}m, ${agent.getTime()}s`);
});
```

## RoutePlannerCallOptions Interface

```typescript
interface RoutePlannerCallOptions {
  apiKey: string;
  baseUrl?: string;
  httpOptions?: Record<string, any>;
}
```

## RoutePlannerInputData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

```typescript
interface RoutePlannerInputData {
  mode?: TravelMode;
  type?: RouteType;
  avoid?: AvoidData[];
  traffic?: TrafficType;
  max_speed?: number;
  units?: DistanceUnitType;
  agents: AgentData[];
  jobs: JobData[];
  shipments: ShipmentData[];
  locations: LocationData[];
}
```

Referenced interfaces:

- [`AgentData`](./agent.md#agentdata-interface)
- [`JobData`](./job.md#jobdata-interface)
- [`ShipmentData`](./shipment.md#shipmentdata-interface)
- [`LocationData`](./location.md#locationdata-interface)
- [`AvoidData`](./avoid.md#avoiddata-interface)

### Travel and Route Types

These types are used by `RoutePlannerInputData` and reused in result params.

```typescript
type TravelMode =
  | 'drive'
  | 'light_truck'
  | 'medium_truck'
  | 'truck'
  | 'heavy_truck'
  | 'truck_dangerous_goods'
  | 'long_truck'
  | 'bus'
  | 'scooter'
  | 'motorcycle'
  | 'bicycle'
  | 'mountain_bike'
  | 'road_bike'
  | 'walk'
  | 'hike'
  | 'transit'
  | 'approximated_transit';
type RouteType = 'balanced' | 'short' | 'less_maneuvers';
type TrafficType = 'free_flow' | 'approximated';
type DistanceUnitType = 'metric' | 'imperial';
```


## Learn More

* [`RoutePlannerResult`](./route-planner-result.md) — Understanding the response
* [`Agent`](./agent.md), [`Job`](./job.md), [`Shipment`](./shipment.md) — Input entities
* [Examples](../examples/optimizing-two-agents.md) — Step-by-step tutorials
* [API Playground](https://apidocs.geoapify.com/playground/route-planner/) — Interactive testing
