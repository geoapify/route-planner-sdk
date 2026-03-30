# RoutePlannerResultEditor

`RoutePlannerResultEditor` helps you modify an already calculated route (`RoutePlannerResult`).

Key functionality:

- Changes can be local or using API, depending on the method and options.
- All edit operations are **soft** (`assign*`, `addNew*`, `remove*`, `moveWaypoint`, `addDelayAfterWaypoint`):  
  the requested change is applied even if constraints are violated.
- Checks route constraints after the change and stores violations in `AgentPlan.getViolations()`.  
  Example: capacity/time-window/capability conflicts appear as violation entries.
- `reoptimizeAgentPlan()` additionally supports two modes via `allowViolations`:  
  strict (`false`) and relaxed (`true`).

## Constructor

```typescript
constructor(result: RoutePlannerResult)
```

Creates a new **RoutePlannerResultEditor** instance that works on a cloned copy of the provided result. Changes do not affect the original object.

Here are the parameters you can pass to the constructor:

| Name | Type | Description |
|------|------|-------------|
| `result` | [`RoutePlannerResult`](./route-planner-result.md) | The route planner result to edit. The editor clones route raw data internally. |

Here's a basic example of how to initialize the editor:

```typescript
import { RoutePlannerResultEditor } from '@geoapify/route-planner-sdk';

const editor = new RoutePlannerResultEditor(result);

// Make modifications...
await editor.assignJobs('agent-A', ['job-1']);

// Get the modified result
const modifiedResult = editor.getModifiedResult();
```

## Methods

The `RoutePlannerResultEditor` class provides methods to modify job and shipment assignments.

| Method | Signature | Purpose |
|--------|-----------|---------|
| [`assignJobs`](#assignjobs) | `assignJobs(agentIdOrIndex, jobIdsOrIndexes, options?): Promise<boolean>` | Reassign existing jobs to an agent |
| [`assignShipments`](#assignshipments) | `assignShipments(agentIdOrIndex, shipmentIdsOrIndexes, options?): Promise<boolean>` | Reassign existing shipments to an agent |
| [`removeJobs`](#removejobs) | `removeJobs(jobIdsOrIndexes, options?): Promise<boolean>` | Remove jobs from the plan |
| [`removeShipments`](#removeshipments) | `removeShipments(shipmentIdsOrIndexes, options?): Promise<boolean>` | Remove shipments from the plan |
| [`addNewJobs`](#addnewjobs) | `addNewJobs(agentIdOrIndex, jobs, options?): Promise<boolean>` | Add new jobs to an agent's plan |
| [`addNewShipments`](#addnewshipments) | `addNewShipments(agentIdOrIndex, shipments, options?): Promise<boolean>` | Add new shipments to an agent's plan |
| [`addDelayAfterWaypoint`](#adddelayafterwaypoint) | `addDelayAfterWaypoint(agentIdOrIndex, waypointIndex, delaySeconds): void` | Add delay after a waypoint |
| [`moveWaypoint`](#movewaypoint) | `moveWaypoint(agentIdOrIndex, fromWaypointIndex, toWaypointIndex): Promise<void>` | Move waypoint in route |
| [`reoptimizeAgentPlan`](#reoptimizeagentplan) | `reoptimizeAgentPlan(agentIdOrIndex, options?): Promise<boolean>` | Reoptimize one agent plan |
| [`getModifiedResult`](#getmodifiedresult) | `getModifiedResult(): RoutePlannerResult` | Returns the modified result |

Here's the detailed version of method descriptions:

### assignJobs()

Signature: `assignJobs(agentIdOrIndex: string | number, jobIdsOrIndexes: string[] | number[], options?: AddAssignOptions): Promise<boolean>`

Reassigns existing jobs to a specified agent. If jobs are currently assigned to another agent, they are removed from that agent first.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agentIdOrIndex` | `string \| number` | The ID or index of the target agent |
| `jobIdsOrIndexes` | `string[] \| number[]` | Array of job IDs or indexes to assign |
| `options` | [`AddAssignOptions`](#addassignoptions) | Assignment options |

**Strategy / options behavior:**

| Strategy | Options | Behavior | API call |
|------|------|------|------|
| `reoptimize` (default) | no options or `{ strategy: 'reoptimize' }` | Full target-agent reoptimization with reassignment | [Route Planner API](https://www.geoapify.com/route-planner-api/) |
| `preserveOrder` | `{ strategy: 'preserveOrder' }` | Find optimal insertion point anywhere while keeping existing order | [Route Matrix API](https://www.geoapify.com/route-matrix-api/) |
| `preserveOrder` | `{ strategy: 'preserveOrder', afterId / afterWaypointIndex }` | Find optimal insertion point after the given position | [Route Matrix API](https://www.geoapify.com/route-matrix-api/) |
| `preserveOrder` | `{ strategy: 'preserveOrder', afterId / afterWaypointIndex, append: true }` | Insert directly after the given position | No API call |
| `preserveOrder` | `{ strategy: 'preserveOrder', append: true }` | Append to route end | No API call |

**Example:**

```typescript
// Default: full reoptimization (Route Planner API)
await editor.assignJobs('agent-A', ['job-1', 'job-2']);

// Find optimal insertion point (Route Matrix API)
await editor.assignJobs('agent-A', ['job-1'], { strategy: 'preserveOrder' });

// Append to end of route (no API call)
await editor.assignJobs('agent-A', ['job-1'], { 
  strategy: 'preserveOrder', 
  append: true 
});

// Find optimal position after specific job (Route Matrix API)
await editor.assignJobs('agent-A', ['job-2'], { 
  strategy: 'preserveOrder', 
  afterId: 'job-1' 
});

// Find optimal position after specific waypoint (Route Matrix API)
await editor.assignJobs('agent-A', ['job-1'], { 
  strategy: 'preserveOrder', 
  afterWaypointIndex: 1  // After first stop
});
```

### assignShipments()

Signature: `assignShipments(agentIdOrIndex: string | number, shipmentIdsOrIndexes: string[] | number[], options?: AddAssignOptions): Promise<boolean>`

Reassigns existing shipments to a specified agent. Both pickup and delivery are moved together.

A shipment usually affects two stops (pickup and delivery), so insertion/removal is more complex than jobs.
The editor keeps shipment consistency during reassignment (pickup must remain before delivery).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agentIdOrIndex` | `string \| number` | The ID or index of the target agent |
| `shipmentIdsOrIndexes` | `string[] \| number[]` | Array of shipment IDs or indexes to assign |
| `options` | [`AddAssignOptions`](#addassignoptions) | Assignment options |

**Strategy / options behavior:**

| Strategy | Options | Behavior | Pickup/Delivery handling | API call |
|------|------|------|------|------|
| `reoptimize` (default) | no options or `{ strategy: 'reoptimize' }` | Full target-agent reoptimization with shipment reassignment | API decides best valid pair placement (`pickup` before `delivery`) | [Route Planner API](https://www.geoapify.com/route-planner-api/) |
| `preserveOrder` | `{ strategy: 'preserveOrder' }` | Find optimal pickup/delivery insertion while keeping existing order | Finds positions for both stops, keeps `pickup` before `delivery` | [Route Matrix API](https://www.geoapify.com/route-matrix-api/) |
| `preserveOrder` | `{ strategy: 'preserveOrder', afterId / afterWaypointIndex }` | Find optimal insertion near the given position | Optimizes pickup and delivery in the route segment starting from the anchor; may reuse existing same-location waypoints | [Route Matrix API](https://www.geoapify.com/route-matrix-api/) |
| `preserveOrder` | `{ strategy: 'preserveOrder', afterId / afterWaypointIndex, append: true }` | Insert shipment directly after given position (pickup and delivery placement resolved locally) | Inserts both stops locally and preserves `pickup` before `delivery` | No API call |
| `preserveOrder` | `{ strategy: 'preserveOrder', append: true }` | Append shipment toward route end with valid pickup/delivery order | Appends the pair at route end while preserving order | No API call |

**Example:**

```typescript
// Default: full reoptimization
await editor.assignShipments('agent-A', ['shipment-1']);

// Find optimal insertion point (Route Matrix API)
await editor.assignShipments('agent-A', ['shipment-1'], { strategy: 'preserveOrder' });

// Append pickup and delivery to end of route (no API call)
await editor.assignShipments('agent-A', ['shipment-1'], { 
  strategy: 'preserveOrder', 
  append: true 
});
```

### removeJobs()

Signature: `removeJobs(jobIdsOrIndexes: string[] | number[], options?: RemoveOptions): Promise<boolean>`

Removes jobs from the plan, marking them as unassigned.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `jobIdsOrIndexes` | `string[] \| number[]` | Array of job IDs or indexes to remove |
| `options` | [`RemoveOptions`](#removeoptions) | Removal options |

**Example:**

```typescript
// Default: reoptimize remaining route
await editor.removeJobs(['job-1', 'job-2']);

// Remove without reordering remaining jobs (fastest)
await editor.removeJobs(['job-1'], { strategy: 'preserveOrder' });
```

### removeShipments()

Signature: `removeShipments(shipmentIdsOrIndexes: string[] | number[], options?: RemoveOptions): Promise<boolean>`

Removes shipments from the plan, marking them as unassigned.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `shipmentIdsOrIndexes` | `string[] \| number[]` | Array of shipment IDs or indexes to remove |
| `options` | [`RemoveOptions`](#removeoptions) | Removal options |

**Example:**

```typescript
// Default: reoptimize remaining route
await editor.removeShipments(['shipment-1']);

// Remove without reordering (preserves existing order)
await editor.removeShipments(['shipment-1'], { strategy: 'preserveOrder' });
```

### addNewJobs()

Signature: `addNewJobs(agentIdOrIndex: string | number, jobs: Job[], options?: AddAssignOptions): Promise<boolean>`

Adds new jobs to an agent's schedule. The jobs are added to the input data and then placed according to the strategy.
Strategy/options behavior is the same as in [`assignJobs()`](#assignjobs) (see its Strategy / options behavior table).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agentIdOrIndex` | `string \| number` | The ID or index of the target agent |
| `jobs` | [`Job[]`](./job.md) | Array of Job objects to add |
| `options` | [`AddAssignOptions`](#addassignoptions) | Assignment options |

**Example:**

```typescript
const newJob = new Job()
  .setId('new-job')
  .setLocation(44.5, 40.2)
  .setDuration(300);

// Default: reoptimize with new job (Route Planner API)
await editor.addNewJobs('agent-A', [newJob]);

// Find optimal insertion point (Route Matrix API)
await editor.addNewJobs('agent-A', [newJob], { strategy: 'preserveOrder' });

// Append to end of route (no API call, fastest)
await editor.addNewJobs('agent-A', [newJob], { 
  strategy: 'preserveOrder', 
  append: true 
});

// Find optimal position after specific waypoint (Route Matrix API)
await editor.addNewJobs('agent-A', [newJob], { 
  strategy: 'preserveOrder', 
  afterWaypointIndex: 2  // After waypoint 2
});
```

### addNewShipments()

Signature: `addNewShipments(agentIdOrIndex: string | number, shipments: Shipment[], options?: AddAssignOptions): Promise<boolean>`

Adds new shipments to an agent's schedule.
Strategy/options behavior is the same as in [`assignShipments()`](#assignshipments) (see its Strategy / options behavior table).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agentIdOrIndex` | `string \| number` | The ID or index of the target agent |
| `shipments` | [`Shipment[]`](./shipment.md) | Array of Shipment objects to add |
| `options` | [`AddAssignOptions`](#addassignoptions) | Assignment options |

**Example:**

```typescript
const newShipment = new Shipment()
  .setId('new-shipment')
  .setPickup(new ShipmentStep().setLocation(44.5, 40.2).setDuration(120))
  .setDelivery(new ShipmentStep().setLocation(44.6, 40.3).setDuration(120));

// Default: reoptimize with new shipment
await editor.addNewShipments('agent-A', [newShipment]);

// Append to end of route (no API call)
await editor.addNewShipments('agent-A', [newShipment], { 
  strategy: 'preserveOrder', 
  append: true 
});
```

### addDelayAfterWaypoint()

Signature: `addDelayAfterWaypoint(agentIdOrIndex: string | number, waypointIndex: number, delaySeconds: number): void`

Adds or updates an action with `type: "delay"` after the specified waypoint.

- Positive value adds delay.
- Negative value is also supported and shifts the schedule earlier.
- Delays can be read from [`AgentPlan.getDelays()`](./agent-plan.md).

```typescript
editor.addDelayAfterWaypoint('agent-A', 2, 300);  // +5 minutes
editor.addDelayAfterWaypoint('agent-A', 2, -120); // -2 minutes

const delays = editor
  .getModifiedResult()
  .getAgentPlan('agent-A')
  ?.getDelays() ?? [];
```

### moveWaypoint()

Signature: `moveWaypoint(agentIdOrIndex: string | number, fromWaypointIndex: number, toWaypointIndex: number): Promise<void>`

Moves a waypoint within one agent route.

Useful when you need manual route adjustments in UI workflows:

- drag-and-drop stop reordering in dispatcher tools
- quick local route tuning without full reassignment
- operational overrides (for example, visit one customer earlier)

```typescript
await editor.moveWaypoint('agent-A', 3, 5);
```

### reoptimizeAgentPlan()

Signature: `reoptimizeAgentPlan(agentIdOrIndex: string | number, options?: ReoptimizeOptions): Promise<boolean>`

Reoptimizes one agent plan.

Useful when route quality degraded after many manual edits, and you want to improve sequencing/time while keeping control over scope.

Options:

- `includeUnassigned`: whether to include currently unassigned jobs/shipments into reoptimization
- `allowViolations`: whether capacity/time-window/capability violations are allowed in the generated plan

```typescript
await editor.reoptimizeAgentPlan('agent-A', {
  includeUnassigned: true,
  allowViolations: false
});
```

### getModifiedResult()

Signature: `getModifiedResult(): RoutePlannerResult`

Returns a `RoutePlannerResult` view for the editor's current state.

Why this method is needed:

- editor methods mutate internal route data
- `getModifiedResult()` gives you the standard result API (`getAgentPlan()`, `getJobPlan()`, `getUnassigned...()`, etc.) on top of that edited state

Each call returns a snapshot with cloned route `raw` data.
This is useful for history workflows (undo/redo) because previously returned results are not affected by future edits.

**Example:**

```typescript
await editor.assignJobs('agent-A', ['job-1']);
await editor.removeShipments(['shipment-2'], { strategy: 'preserveOrder' });

const modifiedResult = editor.getModifiedResult();

// Use the modified result
console.log(modifiedResult.getAgentPlans());
```

## Constraint Validation

Editing operations are forced, then validated.

That means the SDK applies your requested route change first, and if constraints are violated, it records issues or [Route Editor Violations](#route-editor-violations) in the affected `AgentPlan` instead of rejecting the edit.

Use [`AgentPlan.getViolations()`](./agent-plan.md#getviolations) on the modified result to inspect and display those issues in your UI/workflow.

```typescript
const violations = editor.getModifiedResult()
  .getAgentPlan('agent-A')
  ?.getViolations() ?? [];
```

For `reoptimizeAgentPlan()`, use:

- `allowViolations: false` for strict/constraint-preserving reoptimization
- `allowViolations: true` for relaxed reoptimization, then inspect resulting violations

## Strategy Constants

Use exported constants to avoid hardcoded strategy strings:

```typescript
import { REOPTIMIZE, PRESERVE_ORDER } from '@geoapify/route-planner-sdk';
```

| Constant | Value | Typical usage |
|---|---|---|
| `REOPTIMIZE` | `'reoptimize'` | Full API reoptimization for assign/remove |
| `PRESERVE_ORDER` | `'preserveOrder'` | Keep sequence and apply local/Matrix-based insertion/removal |

Related strategy types:

```typescript
type AddAssignStrategy = 'reoptimize' | 'preserveOrder';
type RemoveStrategy = 'reoptimize' | 'preserveOrder';
```

## Options Interfaces

### AddAssignOptions

Options for assigning or adding jobs/shipments to an agent's route.

Used by:

- [`assignJobs()`](#assignjobs)
- [`assignShipments()`](#assignshipments)
- [`addNewJobs()`](#addnewjobs)
- [`addNewShipments()`](#addnewshipments)

```typescript
interface AddAssignOptions {
  strategy?: 'reoptimize' | 'preserveOrder';
  removeStrategy?: 'reoptimize' | 'preserveOrder';
  afterWaypointIndex?: number;
  afterId?: string;
  append?: boolean;
}
```

| Field | Description | Example |
|---|---|---|
| `strategy` | Insert strategy: `reoptimize` (API reoptimization) or `preserveOrder` (keep existing sequence). Position options (`afterWaypointIndex`, `afterId`, `append`) apply only to `preserveOrder`. | `{ strategy: 'preserveOrder' }` |
| `removeStrategy` | When reassigning from another agent, how to update source route. | `{ removeStrategy: 'reoptimize' }` |
| `afterWaypointIndex` | Insert after a specific waypoint index. Only for `preserveOrder`. | `{ strategy: 'preserveOrder', afterWaypointIndex: 3 }` |
| `afterId` | Insert after a stop by ID (job/shipment id). Only for `preserveOrder`. | `{ strategy: 'preserveOrder', afterId: 'job-12' }` |
| `append` | Only for `preserveOrder`: if `true`, place directly after target position (or at end if no position). | `{ strategy: 'preserveOrder', append: true }` |

Example:

```typescript
await editor.assignJobs('agent-A', ['job-12'], {
  strategy: 'preserveOrder',
  afterWaypointIndex: 4,
  append: true
});
```

### RemoveOptions

Options for removing jobs/shipments from an agent's route.

Used by:

- [`removeJobs()`](#removejobs)
- [`removeShipments()`](#removeshipments)

```typescript
interface RemoveOptions {
  strategy?: 'reoptimize' | 'preserveOrder';
}
```

| Field | Description | Example |
|---|---|---|
| `strategy` | Removal strategy: `reoptimize` (API call) or `preserveOrder` (local remove). | `{ strategy: 'preserveOrder' }` |

Example:

```typescript
await editor.removeShipments(['shipment-2'], { strategy: 'preserveOrder' });
```

### ReoptimizeOptions

Used by:

- [`reoptimizeAgentPlan()`](#reoptimizeagentplan)

```typescript
interface ReoptimizeOptions {
  includeUnassigned?: boolean;
  allowViolations?: boolean;
}
```

| Field | Description | Example |
|---|---|---|
| `includeUnassigned` | Include currently unassigned jobs/shipments in reoptimization input. | `{ includeUnassigned: true }` |
| `allowViolations` | Allow violations in generated plan when constraints cannot all be satisfied. | `{ allowViolations: true }` |

Example:

```typescript
await editor.reoptimizeAgentPlan('agent-A', {
  includeUnassigned: true,
  allowViolations: false
});
```

## Route Editor Exceptions

All methods validate input and throw typed route-editor exceptions.

| Exception | Detailed Description | Methods That Can Throw |
|---|---|---|
| `InvalidParameter` | Invalid parameter value or shape (for example, non-array input, missing required argument, or new job/shipment without required location data). | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`removeJobs()`](#removejobs), [`removeShipments()`](#removeshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments), [`reoptimizeAgentPlan()`](#reoptimizeagentplan) |
| `AgentNotFound` | Target agent ID/index does not exist in input `agents[]`. | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments), [`addDelayAfterWaypoint()`](#adddelayafterwaypoint), [`moveWaypoint()`](#movewaypoint), [`reoptimizeAgentPlan()`](#reoptimizeagentplan) |
| `JobNotFound` | One or more job IDs/indexes are not present in input `jobs[]`. | [`assignJobs()`](#assignjobs), [`removeJobs()`](#removejobs) |
| `ShipmentNotFound` | One or more shipment IDs/indexes are not present in input `shipments[]`. | [`assignShipments()`](#assignshipments), [`removeShipments()`](#removeshipments) |
| `AgentHasNoPlan` | Agent exists but currently has no assigned route feature to edit. | [`addDelayAfterWaypoint()`](#adddelayafterwaypoint), [`moveWaypoint()`](#movewaypoint) |
| `NoItemsProvided` | Empty array passed for jobs/shipments/new items. | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`removeJobs()`](#removejobs), [`removeShipments()`](#removeshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments) |
| `ItemsNotUnique` | Input array contains duplicates. | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`removeJobs()`](#removejobs), [`removeShipments()`](#removeshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments) |
| `ItemAlreadyAssigned` | Trying to assign an item to the same agent where it is already assigned. | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments) |
| `InvalidInsertionPosition` | Invalid `afterId` / `afterWaypointIndex` / waypoint move boundary (out of range, end waypoint, start/end move restriction, etc.). | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments), [`addDelayAfterWaypoint()`](#adddelayafterwaypoint), [`moveWaypoint()`](#movewaypoint) |
| `UnknownStrategy` | Unsupported `strategy` / `removeStrategy` value. | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`removeJobs()`](#removejobs), [`removeShipments()`](#removeshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments) |
| `RouteMatrixApiError` | Route Matrix API call failed while finding insertion candidates for preserve-order operations. | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments) when using `strategy: 'preserveOrder'` with optimized insertion |
| `RoutingApiError` | Routing API call failed while recalculating route metrics/legs after an edit. | Any editing method that triggers routing recalculation (typically preserve-order edits) |

## Route Editor Violations

Violations are validation records (not thrown exceptions). They are attached to agent plans and returned by `AgentPlan.getViolations()`.

| Violation | Detailed Description | Produced By Methods |
|---|---|---|
| `Violation` | Base violation record with `agentIndex` and message. | Any method that modifies an agent plan and triggers validation |
| `AgentPickupCapacityExceeded` | Total pickup amount exceeds configured pickup capacity. | [`assignJobs()`](#assignjobs), [`assignShipments()`](#assignshipments), [`removeJobs()`](#removejobs), [`removeShipments()`](#removeshipments), [`addNewJobs()`](#addnewjobs), [`addNewShipments()`](#addnewshipments), [`addDelayAfterWaypoint()`](#adddelayafterwaypoint), [`moveWaypoint()`](#movewaypoint), [`reoptimizeAgentPlan()`](#reoptimizeagentplan) |
| `AgentDeliveryCapacityExceeded` | Total delivery amount exceeds configured delivery capacity. | Same as above (after validation on edited plan) |
| `AgentMissingCapability` | Agent lacks one or more required capabilities for assigned items. | Same as above (after validation on edited plan) |
| `TimeWindowViolation` | Action timing conflicts with agent/item time window constraints. | Same as above (after validation on edited plan) |
| `BreakViolation` | Action timing conflicts with configured break windows. | Same as above (after validation on edited plan) |

## Learn More

* [`RoutePlannerResult`](./route-planner-result.md) – the result object this editor modifies
* [`Job`](./job.md), [`Shipment`](./shipment.md) – entities used in `addNewJobs` and `addNewShipments`
* [Editing Planned Result Example](../examples/editing-planned-result.md) – step-by-step tutorial
