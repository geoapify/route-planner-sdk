# Constraint Validation

`RoutePlannerResultEditor` applies edits first, then validates the updated agent plan.
Validation issues are stored as violations on the affected [`AgentPlan`](../api/agent-plan.md#getviolations).

This applies to all regular edit methods (`assign*`, `addNew*`, `remove*`, `moveWaypoint`, `addDelayAfterWaypoint`):
they are soft and can produce violations instead of failing on constraint conflicts.

If you need strict reoptimization, use [`reoptimizeAgentPlan()`](../api/route-planner-result-editor.md#reoptimizeagentplan) with `allowViolations: false`.

## Basic Flow

```ts
import { RoutePlannerResultEditor } from "@geoapify/route-planner-sdk";

const editor = new RoutePlannerResultEditor(result);

// Any edit operation can produce violations on affected agents
await editor.assignJobs("agent-1", ["job-42"], {
  strategy: "preserveOrder",
  append: true
});

const updated = editor.getModifiedResult();
const agentPlan = updated.getAgentPlan("agent-1");
const violations = agentPlan?.getViolations() ?? [];

violations.forEach((v) => {
  console.log(`${v.name}: ${v.message}`);
});
```

## What Is Validated

Typical violation types:

- `AgentMissingCapability`
- `AgentPickupCapacityExceeded`
- `AgentDeliveryCapacityExceeded`
- `TimeWindowViolation`
- `BreakViolation`

Notes:

- Pickup and delivery capacities are validated independently.
- Violations are attached per agent (`agentIndex`), so read them from the specific `AgentPlan`.

## See Also

- [`RoutePlannerResultEditor`](../api/route-planner-result-editor.md)
- [`Route Editor Violations`](../api/route-planner-result-editor.md#route-editor-violations)
- [`AgentPlan.getViolations()`](../api/agent-plan.md#getviolations)
