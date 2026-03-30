# `JobPlan`

`JobPlan` describes one job in the current result (assigned or unassigned).

Get it from:

- `RoutePlannerResult.getJobPlan(jobIdOrIndex)`
- `RoutePlannerResult.getJobPlans()`

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getJobIndex` | `getJobIndex(): number` | Get job index in input `jobs[]` |
| `getJobInputData` | `getJobInputData(): JobData` | Get original input job payload |
| `getAgentIndex` | `getAgentIndex(): number \| undefined` | Get assigned agent index |
| `getAgentId` | `getAgentId(): string \| undefined` | Get assigned agent id |
| `getAgentPlan` | `getAgentPlan(): AgentPlan \| undefined` | Get assigned `AgentPlan` |
| `getRouteActions` | `getRouteActions(): RouteAction[]` | Get actions related to this job |

### getJobIndex()

Returns job index from input `jobs[]`.

```ts
const index = jobPlan.getJobIndex();
```

### getJobInputData()

Returns original `JobData` payload.

```ts
const inputJob = jobPlan.getJobInputData();
```

### getAgentIndex()

Returns assigned agent index or `undefined` if unassigned.

```ts
const agentIndex = jobPlan.getAgentIndex();
```

### getAgentId()

Returns assigned agent ID or `undefined` if unassigned.

```ts
const agentId = jobPlan.getAgentId();
```

### getAgentPlan()

Returns assigned `AgentPlan` or `undefined` if unassigned.

```ts
const agentPlan = jobPlan.getAgentPlan();
```

### getRouteActions()

Returns route actions linked to this job.

```ts
const actions = jobPlan.getRouteActions();
```

## Example

```ts
const jobPlan = result.getJobPlan('job-1');

if (jobPlan) {
  console.log(jobPlan.getAgentId());
  console.log(jobPlan.getRouteActions().map((a) => a.getType()));
}
```

## JobData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

`JobPlan` references `JobData` from input:

```ts
interface JobData {
  location?: [number, number];
  location_index?: number;
  priority?: number;
  duration?: number;
  pickup_amount?: number;
  delivery_amount?: number;
  requirements: string[];
  time_windows: [number, number][];
  id?: string;
  description?: string;
}
```

## Related

- [`RoutePlannerResult`](./route-planner-result.md)
- [`AgentPlan`](./agent-plan.md)
- [`RouteAction`](./route-action.md)
- [`Job`](./job.md)
