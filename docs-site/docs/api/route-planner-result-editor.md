# `RoutePlannerResultEditor`

The `RoutePlannerResultEditor` class allows you to **modify** an existing route planning result — for example, by reassigning jobs or shipments, or by adding and removing tasks.

This is especially useful for:

- Manual adjustments after planning
- Post-processing logic (e.g., swapping deliveries)
- Integrating user input into optimized results

---

## Purpose

Use `RoutePlannerResultEditor` to:

- Reassign jobs or shipments between agents
- Add new jobs or shipments after optimization
- Remove jobs or shipments from the result
- Retrieve a cleanly updated result for visualization or resubmission

---

## Constructor

```ts
new RoutePlannerResultEditor(result: RoutePlannerResult)
```

Creates an editor instance using a clone of the original `RoutePlannerResult`. Modifications do not affect the original input object.

---

## Modification Methods

| Method                                  | Description                                   |
| --------------------------------------- | --------------------------------------------- |
| `assignJobs(agentId, jobIds)`           | Reassigns existing jobs to a given agent      |
| `assignShipments(agentId, shipmentIds)` | Reassigns existing shipments to a given agent |
| `removeJobs(jobIds)`                    | Removes jobs from the result completely       |
| `removeShipments(shipmentIds)`          | Removes shipments from the result completely  |
| `addNewJobs(agentId, jobs)`             | Adds new jobs to an agent’s plan              |
| `addNewShipments(agentId, shipments)`   | Adds new shipments to an agent’s plan         |

> All methods return a `Promise<boolean>` indicating whether the operation succeeded.

---

## Output

| Method                | Description                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `getModifiedResult()` | Returns the updated [`RoutePlannerResult`](./route-planner-result.md) after all modifications |

---

## Example

```ts
const editor = new RoutePlannerResultEditor(result);

// Move job-1 to agent-2
await editor.assignJobs("agent-2", ["job-1"]);

// Add new shipment to agent-1
await editor.addNewShipments("agent-1", [new Shipment().setId("new-shipment")]);

const updatedResult = editor.getModifiedResult();
```

---

## Error Handling

| Method                     | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `assertArray(array, name)` | Internal utility for validating input argument types (arrays only) |

---

## Related

* [`RoutePlannerResult`](./route-planner-result.md) – the source result this editor modifies
* [`Job`](./job.md), [`Shipment`](./shipment.md) – input objects added via `addNewJobs` or `addNewShipments`
* [`Agent`](./agent.md) – target for reassignment