# Understanding Editing Functionality

The SDK editing layer (`RoutePlannerResultEditor`) lets you change an already calculated plan.

You can apply edits:

- **With optimization** (`strategy: 'reoptimize'`) — recalculates route after the change.
- **Without full optimization** (`strategy: 'preserveOrder'`) — keeps existing order and applies targeted local changes.

## What You Can Edit

| Editing Function | API Method | Typical Use Case |
|---|---|---|
| Reassign jobs | [`assignJobs()`](./api/route-planner-result-editor.md#assignjobs) | Dispatcher moves urgent stops to another driver. |
| Reassign shipments | [`assignShipments()`](./api/route-planner-result-editor.md#assignshipments) | Rebalance pickup/delivery workload during the day. |
| Remove jobs | [`removeJobs()`](./api/route-planner-result-editor.md#removejobs) | Customer canceled an appointment. |
| Remove shipments | [`removeShipments()`](./api/route-planner-result-editor.md#removeshipments) | Shipment postponed to next shift. |
| Add new jobs | [`addNewJobs()`](./api/route-planner-result-editor.md#addnewjobs) | Last-minute same-day service request. |
| Add new shipments | [`addNewShipments()`](./api/route-planner-result-editor.md#addnewshipments) | New pickup + dropoff arrives after planning. |
| Move an existing stop | [`moveWaypoint()`](./api/route-planner-result-editor.md#movewaypoint) | Manual resequencing for operational reasons. |
| Add route delay | [`addDelayAfterWaypoint()`](./api/route-planner-result-editor.md#adddelayafterwaypoint) | Traffic incident, loading queue, access delay. |
| Reoptimize one agent | [`reoptimizeAgentPlan()`](./api/route-planner-result-editor.md#reoptimizeagentplan) | Improve one route without recalculating all agents. |
| Read edited plan | [`getModifiedResult()`](./api/route-planner-result-editor.md#getmodifiedresult) | Save/visualize/export the updated plan. |

## Constraint Behavior: Edits Are Applied, Then Validated

Editing operations are **command-driven**: they apply the requested change first, then validate the updated route.

This soft behavior applies to all core edit methods:
`assign*`, `addNew*`, `remove*`, `moveWaypoint`, and `addDelayAfterWaypoint`.

This means edits are not automatically blocked by every operational limit.  
Instead, detected constraint issues are attached to the affected agent plan as violations.

Check violations like this:

```ts
const updated = editor.getModifiedResult();
const agentPlan = updated.getAgentPlan("agent-1");
const violations = agentPlan?.getViolations() ?? [];
```

Common violation types:

- `AgentMissingCapability`
- `AgentPickupCapacityExceeded`
- `AgentDeliveryCapacityExceeded`
- `TimeWindowViolation`
- `BreakViolation`

See [`Route Editor Violations`](./api/route-planner-result-editor.md#route-editor-violations).

`reoptimizeAgentPlan()` adds explicit control:

- `allowViolations: false` => strict/constraint-preserving reoptimization
- `allowViolations: true` => relaxed reoptimization, then inspect violations

## Input Validation and Errors

The editor validates input parameters and throws typed errors when input is invalid.

Examples:

```ts
// Unknown agent
await editor.assignJobs("no-such-agent", ["job-1"]);
// -> AgentNotFound

// Empty item list
await editor.removeJobs([]);
// -> NoItemsProvided

// Duplicates in input
await editor.assignShipments("agent-1", ["shipment-7", "shipment-7"]);
// -> ItemsNotUnique

// Unknown job ID
await editor.assignJobs("agent-1", ["missing-job"]);
// -> JobNotFound

// Invalid insertion point
await editor.moveWaypoint("agent-1", 999, 1);
// -> InvalidInsertionPosition
```

See full lists:

- [`Route Editor Exceptions`](./api/route-planner-result-editor.md#route-editor-exceptions)
- [`Route Editor Violations`](./api/route-planner-result-editor.md#route-editor-violations)
