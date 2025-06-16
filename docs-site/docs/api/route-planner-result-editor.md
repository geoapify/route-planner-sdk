# `RoutePlannerResultEditor`

The `RoutePlannerResultEditor` class allows you to **modify** an existing route planning result — for example, by reassigning jobs or shipments, adding new ones, or removing tasks.

This is especially useful for:

* Manual adjustments after optimization
* Post-processing logic (e.g., reprioritizing deliveries)
* Integrating user edits into optimized results

---

## Purpose

Use `RoutePlannerResultEditor` to:

* Reassign jobs or shipments between agents
* Add new jobs or shipments after optimization
* Remove jobs or shipments from the result
* Retrieve an updated result for visualization or re-submission

---

## Constructor

```ts
new RoutePlannerResultEditor(result: RoutePlannerResult)
```

Creates an editor instance using a deep clone of the original `RoutePlannerResult`. Changes do not affect the original object.

---

## Modification Methods

| Method                                                             | Description                                                                       |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `assignJobs(agentIdOrIndex, jobIdsOrIndexes, priority?)`           | Reassigns existing jobs to the specified agent, optionally updating priority      |
| `assignShipments(agentIdOrIndex, shipmentIdsOrIndexes, priority?)` | Reassigns existing shipments to the specified agent, optionally updating priority |
| `removeJobs(jobIdsOrIndexes)`                                      | Completely removes the given jobs from the plan                                   |
| `removeShipments(shipmentIdsOrIndexes)`                            | Completely removes the given shipments from the plan                              |
| `addNewJobs(agentIdOrIndex, jobs)`                                 | Adds new jobs to an agent’s plan                                                  |
| `addNewShipments(agentIdOrIndex, shipments)`                       | Adds new shipments to an agent’s plan                                             |

> All modification methods return a `Promise<boolean>` indicating whether the operation succeeded.

Each method supports both IDs (`string[]`) and indexes (`number[]`) for referencing jobs, shipments, and agents.

---

## Output

| Method                | Description                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `getModifiedResult()` | Returns the updated [`RoutePlannerResult`](./route-planner-result.md) after modifications |

---

## Example

```ts
const editor = new RoutePlannerResultEditor(result);

// Move job-1 to agent-2 and change priority
await editor.assignJobs("agent-2", ["job-1"], 10);

// Add a new shipment to agent-1
await editor.addNewShipments("agent-1", [new Shipment().setId("new-shipment")]);

const updatedResult = editor.getModifiedResult();
```

---

## Error Handling

| Method                     | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `assertArray(array, name)` | Internal utility for validating that inputs are arrays |

All methods throw if provided agent/job/shipment IDs are not found.

---

## Related

* [`RoutePlannerResult`](./route-planner-result.md) – the result object this editor modifies
* [`Job`](./job.md), [`Shipment`](./shipment.md) – entities used in `addNewJobs` and `addNewShipments`
* [`Agent`](./agent.md) – entity used for assignment