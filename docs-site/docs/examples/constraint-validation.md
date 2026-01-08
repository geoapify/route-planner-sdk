# Constraint Validation

The Route Planner SDK automatically validates constraints when you modify routes using the `RoutePlannerResultEditor`. This ensures agents aren't overloaded and requirements are met.

## Validation Modes

### Default Mode (allowViolations: true)

By default, violations are collected and added to the result for later inspection:

```typescript
const editor = new RoutePlannerResultEditor(result);

// Agent with 500kg delivery capacity
const heavyJob = new Job()
  .setId('overloaded-delivery')
  .setDeliveryAmount(600);  // Exceeds capacity!

// Default: violations collected, method succeeds
await editor.addNewJobs('agent-A', [heavyJob]);

// Check violations
const modifiedResult = editor.getModifiedResult();
const violations = modifiedResult.getViolations();

if (violations.length > 0) {
  console.log('Warning: Constraint violations detected:');
  violations.forEach(v => console.log(`  - ${v}`));
}
```

**Output:**
```
Warning: Constraint violations detected:
  - Total delivery amount (600) exceeds agent capacity (500)
```

### Strict Mode (allowViolations: false)

To fail immediately when constraints are violated:

```typescript
try {
  await editor.addNewJobs('agent-A', [heavyJob], { allowViolations: false });
} catch (validationErrors) {
  if (validationErrors instanceof ValidationErrors) {
    console.error(`Cannot add jobs: ${validationErrors.errors.length} violations found`);
    validationErrors.errors.forEach(error => {
      console.error(`  - ${error.constructor.name}: ${error.message}`);
    });
  }
}
```

**Output:**
```
Cannot add jobs: 1 violations found
  - AgentDeliveryCapacityExceeded: Total delivery amount (600) exceeds agent capacity (500)
```

## Validated Constraints

### 1. Agent Capabilities

Ensures agent has all required capabilities:

```typescript
const refrigeratedVan = new Agent()
  .setId('cold-chain-van')
  .addCapability('refrigerated')
  .addCapability('standard_delivery');

const regularVan = new Agent()
  .setId('regular-van')
  .addCapability('standard_delivery');

const coldFood = new Job()
  .setId('frozen-food')
  .addRequirement('refrigerated');

// ✅ Works: refrigerated van has the capability
await editor.addNewJobs('cold-chain-van', [coldFood]);

// ❌ Violation: regular van missing 'refrigerated' capability
await editor.addNewJobs('regular-van', [coldFood], { allowViolations: false });
// Throws: AgentMissingCapability
```

### 2. Pickup Capacity

Validates total pickup amount (existing + new):

```typescript
const smallVan = new Agent()
  .setId('small-van')
  .setPickupCapacity(500);  // 500kg capacity

// Agent already has 300kg pickup
const existingPickup = 300;

const heavyPickups = [
  new Job().setId('pickup-1').setPickupAmount(250),
  new Job().setId('pickup-2').setPickupAmount(200)
];
// New: 450kg, Total: 300 + 450 = 750kg

// ❌ Violation: 750kg > 500kg capacity
await editor.addNewJobs('small-van', heavyPickups, { allowViolations: false });
// Throws: AgentPickupCapacityExceeded
```

### 3. Delivery Capacity

Validates total delivery amount:

```typescript
const deliveryTruck = new Agent()
  .setId('delivery-truck')
  .setDeliveryCapacity(1000);

const heavyDeliveries = [
  new Job().setId('del-1').setDeliveryAmount(600),
  new Job().setId('del-2').setDeliveryAmount(500)
];
// Total: 1100kg

// ❌ Violation: exceeds 1000kg capacity
await editor.addNewJobs('delivery-truck', heavyDeliveries, { allowViolations: false });
// Throws: AgentDeliveryCapacityExceeded
```

### 4. Time Windows

Ensures agent availability overlaps with job time windows:

```typescript
const dayShiftAgent = new Agent()
  .setId('day-driver')
  .addTimeWindow(32400, 61200);  // 9am-5pm

const eveningJob = new Job()
  .setId('evening-delivery')
  .addTimeWindow(64800, 72000);  // 6pm-8pm

// ❌ Violation: no overlap between 9am-5pm and 6pm-8pm
await editor.addNewJobs('day-driver', [eveningJob], { allowViolations: false });
// Throws: TimeWindowViolation
```

**Partial overlap is OK:**

```typescript
const lateAfternoonJob = new Job()
  .setId('late-delivery')
  .addTimeWindow(57600, 64800);  // 4pm-6pm (overlaps 4pm-5pm)

// ✅ Works: partial overlap is sufficient
await editor.addNewJobs('day-driver', [lateAfternoonJob]);
```

### 5. Break Conflicts

Jobs cannot fall entirely within break periods:

```typescript
const driverWithLunch = new Agent()
  .setId('driver')
  .addTimeWindow(32400, 61200)  // 9am-5pm
  .addBreak(
    new Break().addTimeWindow(43200, 46800)  // 12pm-1pm lunch
  );

const lunchOnlyJob = new Job()
  .setId('lunch-time-delivery')
  .addTimeWindow(43800, 45900);  // 12:10pm-12:45pm

// ❌ Violation: job window entirely within break
await editor.addNewJobs('driver', [lunchOnlyJob], { allowViolations: false });
// Throws: BreakViolation
```

**Jobs spanning breaks are OK:**

```typescript
const spanningJob = new Job()
  .setId('flexible-delivery')
  .addTimeWindow(41400, 48600);  // 11:30am-1:30pm (can do before or after lunch)

// ✅ Works: job can be done before or after break
await editor.addNewJobs('driver', [spanningJob]);
```

## Multiple Violations

When a job has multiple constraint issues, all are reported:

```typescript
const limitedAgent = new Agent()
  .setId('basic-courier')
  .addCapability('standard')
  .addTimeWindow(32400, 61200)  // 9am-5pm
  .setDeliveryCapacity(500);

const problematicJob = new Job()
  .setId('problem-delivery')
  .addRequirement('refrigerated')     // Missing capability
  .addRequirement('hazmat_certified') // Missing capability
  .addTimeWindow(64800, 72000)        // 6pm-8pm (outside work hours)
  .setDeliveryAmount(600);            // Exceeds 500kg capacity

// Default: collect all violations
await editor.addNewJobs('basic-courier', [problematicJob]);

const violations = editor.getModifiedResult().getViolations();
console.log(violations);
// [
//   "Agent is missing required capabilities: refrigerated, hazmat_certified",
//   "No overlap between agent and job time windows",
//   "Total delivery amount (600) exceeds agent capacity (500)"
// ]
```

## Best Practices

### Development Mode

Use default behavior to see all issues:

```typescript
// Development: collect violations
await editor.addNewJobs(agentId, newJobs);

const violations = editor.getModifiedResult().getViolations();
if (violations.length > 0) {
  console.warn('Found constraint violations:', violations);
  // Log for debugging, but allow plan to proceed
}
```

### Production Mode

Use strict mode for critical operations:

```typescript
// Production: fail fast
try {
  await editor.addNewJobs(agentId, criticalJobs, { allowViolations: false });
} catch (validationErrors) {
  if (validationErrors instanceof ValidationErrors) {
    // Handle validation errors
    notifyUser(`Cannot assign jobs: ${validationErrors.message}`);
    return;
  }
  throw validationErrors;  // Re-throw other errors
}
```

### Validation Before API Call

Validations run **before** calling the Route Planner API, saving API credits when constraints are violated.

```typescript
// Validation happens first (no API call if violations found with allowViolations: false)
await editor.addNewJobs('agent-A', [job], { allowViolations: false });
// Only calls API if validation passes ✅
```

## See Also

* [RoutePlannerResultEditor](../api/route-planner-result-editor.md) - Editor API reference
* [Editing Planned Result](./editing-planned-result.md) - Complete editing tutorial

