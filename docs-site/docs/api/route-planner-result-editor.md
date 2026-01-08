# RoutePlannerResultEditor

This page documents the `RoutePlannerResultEditor` class from the `@geoapify/route-planner-sdk` library — including setup, configuration, and available methods.
Use it to **modify route planning results** after optimization, such as reassigning jobs or shipments between agents, adding new tasks, or removing existing ones.

## Constructor

```typescript
constructor(result: RoutePlannerResult)
```

Creates a new **RoutePlannerResultEditor** instance that works on a cloned copy of the provided result. Changes do not affect the original object.

Here are the parameters you can pass to the constructor:

| Name | Type | Description |
|------|------|-------------|
| `result` | [`RoutePlannerResult`](./route-planner-result.md) | The route planner result to edit. The editor creates a deep clone internally. |

Here's a basic example of how to initialize the editor:

```typescript
import { RoutePlannerResultEditor } from '@geoapify/route-planner-sdk';

const editor = new RoutePlannerResultEditor(result);

// Make modifications...
await editor.assignJobs('agent-2', ['job-1']);

// Get the modified result
const modifiedResult = editor.getModifiedResult();
```

## Strategies

The editor supports different strategies for modifying routes. Choose based on your performance needs and use case:

| Strategy | For | Description |
|----------|-----|-------------|
| `reoptimize` | Add/Assign/Remove | Full route re-optimization (default). Calls the API to find optimal placement. Best results but slowest. |
| `insert` | Add/Assign | Insert at optimal position or specified index. Uses Route Matrix API if no position given. Good balance of quality and speed. |
| `append` | Add/Assign | Add to end of route without reordering. Fastest option, no API call needed. |
| `preserveOrder` | Remove | Remove without reordering remaining stops. No API call needed, keeps existing order. |

You can use strategy constants for type safety:

```typescript
import { REOPTIMIZE, INSERT, APPEND, PRESERVE_ORDER } from '@geoapify/route-planner-sdk';

await editor.assignJobs('agent-A', ['job-1'], { strategy: APPEND });
await editor.removeJobs(['job-2'], { strategy: PRESERVE_ORDER });
```

## Methods

The `RoutePlannerResultEditor` class provides methods to modify job and shipment assignments. Each method returns a `Promise<boolean>` indicating success.

| Method | Signature | Purpose |
|--------|-----------|---------|
| [`assignJobs`](#assignjobs) | `assignJobs(agentIdOrIndex, jobIdsOrIndexes, options?): Promise<boolean>` | Reassign existing jobs to an agent |
| [`assignShipments`](#assignshipments) | `assignShipments(agentIdOrIndex, shipmentIdsOrIndexes, options?): Promise<boolean>` | Reassign existing shipments to an agent |
| [`removeJobs`](#removejobs) | `removeJobs(jobIdsOrIndexes, options?): Promise<boolean>` | Remove jobs from the plan |
| [`removeShipments`](#removeshipments) | `removeShipments(shipmentIdsOrIndexes, options?): Promise<boolean>` | Remove shipments from the plan |
| [`addNewJobs`](#addnewjobs) | `addNewJobs(agentIdOrIndex, jobs, options?): Promise<boolean>` | Add new jobs to an agent's plan |
| [`addNewShipments`](#addnewshipments) | `addNewShipments(agentIdOrIndex, shipments, options?): Promise<boolean>` | Add new shipments to an agent's plan |
| [`getModifiedResult`](#getmodifiedresult) | `getModifiedResult(): RoutePlannerResult` | Returns the modified result |

Here's the detailed version of method descriptions:

### assignJobs()

Signature: `assignJobs(agentIdOrIndex: string | number, jobIdsOrIndexes: string[] | number[], options?: AddAssignOptions | number): Promise<boolean>`

Reassigns existing jobs to a specified agent. If jobs are currently assigned to another agent, they are removed from that agent first.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agentIdOrIndex` | `string \| number` | The ID or index of the target agent |
| `jobIdsOrIndexes` | `string[] \| number[]` | Array of job IDs or indexes to assign |
| `options` | [`AddAssignOptions`](#addassignoptions) \| `number` | Assignment options or priority (for backward compatibility) |

**Example:**

```typescript
// Default: full reoptimization
await editor.assignJobs('agent-A', ['job-1', 'job-2']);

// With priority (backward compatible)
await editor.assignJobs('agent-A', ['job-1'], 100);

// Append to end of route (fastest, no API call)
await editor.assignJobs('agent-A', ['job-1'], { strategy: 'append' });

// Insert at optimal position
await editor.assignJobs('agent-A', ['job-1'], { strategy: 'insert' });

// Insert after specific job
await editor.assignJobs('agent-A', ['job-2'], { 
  strategy: 'insert', 
  afterId: 'job-1' 
});

// Insert at specific index
await editor.assignJobs('agent-A', ['job-1'], { 
  strategy: 'insert', 
  insertAtIndex: 2 
});
```

### assignShipments()

Signature: `assignShipments(agentIdOrIndex: string | number, shipmentIdsOrIndexes: string[] | number[], options?: AddAssignOptions | number): Promise<boolean>`

Reassigns existing shipments to a specified agent. Both pickup and delivery are moved together.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agentIdOrIndex` | `string \| number` | The ID or index of the target agent |
| `shipmentIdsOrIndexes` | `string[] \| number[]` | Array of shipment IDs or indexes to assign |
| `options` | [`AddAssignOptions`](#addassignoptions) \| `number` | Assignment options or priority |

**Example:**

```typescript
// Default: full reoptimization
await editor.assignShipments('agent-A', ['shipment-1']);

// Append pickup and delivery to end of route
await editor.assignShipments('agent-A', ['shipment-1'], { strategy: 'append' });

// Insert at optimal position
await editor.assignShipments('agent-B', ['shipment-2'], { strategy: 'insert' });
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

// Default: reoptimize with new job
await editor.addNewJobs('agent-A', [newJob]);

// Append to end of route (fastest)
await editor.addNewJobs('agent-A', [newJob], { strategy: 'append' });

// Insert at specific position
await editor.addNewJobs('agent-A', [newJob], { 
  strategy: 'insert', 
  insertAtIndex: 3 
});
```

### addNewShipments()

Signature: `addNewShipments(agentIdOrIndex: string | number, shipments: Shipment[], options?: AddAssignOptions): Promise<boolean>`

Adds new shipments to an agent's schedule.

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

// Append to end of route
await editor.addNewShipments('agent-A', [newShipment], { strategy: 'append' });
```

### getModifiedResult()

Signature: `getModifiedResult(): RoutePlannerResult`

Returns the modified result after all operations have been applied.

**Example:**

```typescript
await editor.assignJobs('agent-A', ['job-1']);
await editor.removeShipments(['shipment-2'], { strategy: 'preserveOrder' });

const modifiedResult = editor.getModifiedResult();

// Use the modified result
console.log(modifiedResult.getAgentSolutions());
```

## Options Interfaces

### AddAssignOptions

Options for assigning or adding jobs/shipments to an agent's route.

```typescript
interface AddAssignOptions {
  /**
   * Strategy for adding/assigning items to the route.
   * - 'reoptimize': Full route re-optimization (default)
   * - 'insert': Insert at optimal or specified position
   * - 'append': Add to end of route
   */
  strategy?: 'reoptimize' | 'insert' | 'append';

  /** Insert at a specific index in the agent's route (with 'insert' strategy) */
  insertAtIndex?: number;

  /** Insert before the stop with this ID (with 'insert' strategy) */
  beforeId?: string;

  /** Insert after the stop with this ID (with 'insert' strategy) */
  afterId?: string;

  /** Priority for optimization (higher = more important) */
  priority?: number;

  /**
   * When true (default), constraint violations are added to result violations instead of throwing.
   * When false, violations throw ValidationErrors immediately.
   * @default true
   */
  allowViolations?: boolean;
}
```

### RemoveOptions

Options for removing jobs/shipments from an agent's route.

```typescript
interface RemoveOptions {
  /**
   * Strategy for removing items from the route.
   * - 'reoptimize': Full route re-optimization after removal (default)
   * - 'preserveOrder': Remove without reordering remaining stops
   */
  strategy?: 'reoptimize' | 'preserveOrder';
}
```

## Strategy Comparison

| Strategy | Speed | API Calls | Best For |
|----------|-------|-----------|----------|
| `reoptimize` | Slowest | Yes (Route Planner API) | Finding optimal route after changes |
| `insert` | Medium | Yes (Route Matrix API) | Quick optimal insertion without full reoptimization |
| `append` | Fastest | No | Real-time UI updates, drag-and-drop |
| `preserveOrder` | Fastest | No | Quick removal when order doesn't matter |

## Constraint Validation

The editor automatically validates constraints when adding or assigning jobs/shipments. By default, violations are collected and added to the result (not thrown).

### Validated Constraints

| Constraint | Description |
|------------|-------------|
| **Capabilities** | Agent must have all required capabilities for the job/shipment |
| **Pickup Capacity** | Total pickup amount must not exceed agent's capacity |
| **Delivery Capacity** | Total delivery amount must not exceed agent's capacity |
| **Time Windows** | Agent availability must overlap with job/shipment time windows |
| **Breaks** | Job/shipment cannot fall entirely within agent break periods |

### Default Behavior (allowViolations: true)

By default, violations are collected and can be retrieved later:

```typescript
const newJob = new Job()
  .setId('overloaded-job')
  .addRequirement('refrigerated')  // Agent doesn't have this
  .setDeliveryAmount(1000);        // Exceeds capacity

// Default: violations collected, method succeeds
await editor.addNewJobs('agent-A', [newJob]);

// Check violations
const violations = editor.getModifiedResult().getViolations();
console.log(violations);
// [
//   "Agent is missing required capability: 'refrigerated'",
//   "Total delivery amount (1000) exceeds agent capacity (500)"
// ]
```

### Strict Mode (allowViolations: false)

To throw immediately on violations:

```typescript
try {
  await editor.addNewJobs('agent-A', [newJob], { allowViolations: false });
} catch (validationErrors) {
  if (validationErrors instanceof ValidationErrors) {
    console.log(`Found ${validationErrors.errors.length} violations:`);
    validationErrors.errors.forEach(error => {
      console.log(`- ${error.constructor.name}: ${error.message}`);
    });
  }
}
```

### Violation Types

The following exception classes are thrown when `allowViolations: false`:

* `AgentMissingCapability` – Agent lacks required capability or skill
* `AgentPickupCapacityExceeded` – Total pickup amount exceeds capacity
* `AgentDeliveryCapacityExceeded` – Total delivery amount exceeds capacity
* `TimeWindowViolation` – No overlap between agent and item time windows
* `BreakViolation` – Item can only be done during agent break periods
* `ValidationErrors` – Container for multiple validation errors

## Error Handling

All methods throw errors for:

* Invalid agent ID or index
* Invalid job/shipment ID or index
* Empty arrays
* Duplicate IDs in arrays
* Invalid `beforeId` or `afterId` references
* Constraint violations (when `allowViolations: false`)

## Learn More

* [`RoutePlannerResult`](./route-planner-result.md) – the result object this editor modifies
* [`Job`](./job.md), [`Shipment`](./shipment.md) – entities used in `addNewJobs` and `addNewShipments`
* [Editing Planned Result Example](../examples/editing-planned-result.md) – step-by-step tutorial
