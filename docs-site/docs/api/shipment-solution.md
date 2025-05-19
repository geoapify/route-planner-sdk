# `ShipmentSolution`

The `ShipmentSolution` class provides the result of how a specific shipment (with pickup and delivery) was executed in the final route plan. It ties the shipment to the agent who completed it and includes the related execution actions.

This class is useful for post-optimization analysis, visual tracking, auditing, and logistics reporting.

---

## Purpose

Use `ShipmentSolution` to:

- Inspect which agent handled a given shipment
- Analyze the pickup and delivery actions taken
- Review timing, locations, and fulfillment results
- Generate shipment-level execution logs or reports

---

## Constructor

```ts
new ShipmentSolution(raw: ShipmentSolutionData)
```

Creates a new instance of `ShipmentSolution`. Throws an error if no input is provided.

---

## Methods

| Method          | Description                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `getRaw()`      | Returns the raw `ShipmentSolutionData` object                                                              |
| `getAgentId()`  | Returns the `id` of the agent assigned to this shipment                                                    |
| `getAgent()`    | Returns the full [`AgentSolution`](./agent-solution.md) for the executing agent                            |
| `getShipment()` | Returns the original [`Shipment`](./shipment.md) object that was planned                                   |
| `getActions()`  | Returns an array of [`RouteAction`](./route-action.md) objects showing pickup and delivery execution steps |

---

## Example

```ts
const shipmentPlan = new ShipmentSolution(data);

console.log("Handled by agent:", shipmentPlan.getAgentId());

const shipment = shipmentPlan.getShipment();
const actions = shipmentPlan.getActions();
```

This helps you track the full delivery chain for any shipment — who picked it up, when it was delivered, and which route segments were involved.

---

## Related

* [`Shipment`](./shipment.md) – original task containing pickup and delivery steps
* [`AgentSolution`](./agent-solution.md) – full route and timeline of the assigned agent
* [`RouteAction`](./route-action.md) – execution steps like pickup or delivery
* [`RoutePlannerResult`](./route-planner-result.md) – main object used to extract all shipment results