# `ShipmentPlan`

`ShipmentPlan` describes one shipment in the current result (assigned or unassigned).

Get it from:

- `RoutePlannerResult.getShipmentPlan(shipmentIdOrIndex)`
- `RoutePlannerResult.getShipmentPlans()`

## Methods

| Method | Signature | Purpose |
|---|---|---|
| `getShipmentIndex` | `getShipmentIndex(): number` | Get shipment index in input `shipments[]` |
| `getShipmentId` | `getShipmentId(): string \| undefined` | Get shipment id from input |
| `getShipmentInputData` | `getShipmentInputData(): ShipmentData` | Get original shipment payload |
| `getAgentIndex` | `getAgentIndex(): number \| undefined` | Get assigned agent index |
| `getAgentId` | `getAgentId(): string \| undefined` | Get assigned agent id |
| `getAgentPlan` | `getAgentPlan(): AgentPlan \| undefined` | Get assigned `AgentPlan` |
| `getRouteActions` | `getRouteActions(): RouteAction[]` | Get shipment pickup/delivery actions |

### getShipmentIndex()

Returns shipment index from input `shipments[]`.

```ts
const index = shipmentPlan.getShipmentIndex();
```

### getShipmentId()

Returns shipment ID (if defined in input).

```ts
const id = shipmentPlan.getShipmentId();
```

### getShipmentInputData()

Returns original `ShipmentData` payload.

```ts
const inputShipment = shipmentPlan.getShipmentInputData();
```

### getAgentIndex()

Returns assigned agent index or `undefined` if unassigned.

```ts
const agentIndex = shipmentPlan.getAgentIndex();
```

### getAgentId()

Returns assigned agent id or `undefined` if unassigned.

```ts
const agentId = shipmentPlan.getAgentId();
```

### getAgentPlan()

Returns assigned `AgentPlan` or `undefined` if unassigned.

```ts
const plan = shipmentPlan.getAgentPlan();
```

### getRouteActions()

Returns actions linked to this shipment.

```ts
const actions = shipmentPlan.getRouteActions();
```

## Example

```ts
const shipmentPlan = result.getShipmentPlan('shipment-1');

if (shipmentPlan) {
  console.log(shipmentPlan.getAgentId());
  console.log(shipmentPlan.getRouteActions().map((a) => a.getType()));
}
```

## ShipmentData Interface

This is the original plain data object shape used in API payloads (request/response), not the SDK wrapper class.

`ShipmentPlan` references `ShipmentData` from input:

```ts
interface ShipmentData {
  id?: string;
  pickup?: ShipmentStepData;
  delivery?: ShipmentStepData;
  requirements: string[];
  priority?: number;
  description?: string;
  amount?: number;
}
```

## Related

- [`RoutePlannerResult`](./route-planner-result.md)
- [`AgentPlan`](./agent-plan.md)
- [`RouteAction`](./route-action.md)
- [`Shipment`](./shipment.md)
