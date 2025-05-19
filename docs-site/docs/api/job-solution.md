# `JobSolution`

The `JobSolution` class represents the result of how a specific job was handled in the final optimized route plan. It links the job to its assigned agent and shows the actions required to complete it.

This class is useful for querying job-level execution details after optimization — such as which agent performed the job, when, and through which actions.

---

## Purpose

Use `JobSolution` to:

- Inspect how and when a job was executed
- Determine which agent handled the job
- Access detailed route actions and assignment results
- Analyze job assignment distribution in a multi-agent scenario

---

## Constructor

```ts
new JobSolution(raw: JobSolutionData)
```

Creates a new `JobSolution` instance from raw result data. Throws an error if no data is provided.

---

## Methods

| Method         | Description                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `getRaw()`     | Returns the internal `JobSolutionData` object                                                                    |
| `getAgentId()` | Returns the `id` of the agent that handled the job                                                               |
| `getAgent()`   | Returns the full [`AgentSolution`](./agent-solution.md) instance for the assigned agent                          |
| `getJob()`     | Returns the original [`Job`](./job.md) definition that was assigned                                              |
| `getActions()` | Returns an array of [`RouteAction`](./route-action.md) objects showing what steps were taken to complete the job |

---

## Example

```ts
const jobPlan = new JobSolution(data);

console.log("Handled by agent:", jobPlan.getAgentId());

const job = jobPlan.getJob();
const actions = jobPlan.getActions();
```

You can use this to group or filter completed jobs by agent, analyze performance, or visualize job execution across a timeline.

---

## Related

* [`Job`](./job.md) – the original job that was assigned
* [`AgentSolution`](./agent-solution.md) – full plan for the agent who completed the job
* [`RouteAction`](./route-action.md) – each step taken to complete the job
* [`RoutePlannerResult`](./route-planner-result.md) – high-level access to all results
