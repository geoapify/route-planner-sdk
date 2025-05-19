# Example: Planning 20 Shipments with 3 Agents

This example demonstrates how to use the Geoapify Route Optimization SDK to:

* Create multiple agents
* Define 20 shipments with predefined pickup and delivery points
* Optimize delivery plans for 3 agents

---

## 1. Import the SDK

```ts
import RoutePlanner, { Agent, Shipment, ShipmentStep } from "@geoapify/route-planner-sdk";
```

---

## 2. Create the Planner

```ts
const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" });
```

---

## 3. Add Agents

Each agent has a different starting point:

```ts
planner
  .addAgent(new Agent().setId("agent-1").setStartLocation(13.40, 52.52))
  .addAgent(new Agent().setId("agent-2").setStartLocation(13.42, 52.50))
  .addAgent(new Agent().setId("agent-3").setStartLocation(13.39, 52.53));
```

---

## 4. Add 20 Shipments with Predefined Coordinates

Below are example coordinates for pickups and deliveries. You can replace them with real-world locations.

```ts
const shipmentCoords = [
  { pickup: [13.35, 52.50], delivery: [13.45, 52.55] },
  { pickup: [13.36, 52.51], delivery: [13.44, 52.54] },
  { pickup: [13.37, 52.52], delivery: [13.43, 52.53] },
  { pickup: [13.38, 52.53], delivery: [13.42, 52.52] },
  { pickup: [13.39, 52.54], delivery: [13.41, 52.51] },
  { pickup: [13.40, 52.55], delivery: [13.40, 52.50] },
  { pickup: [13.41, 52.50], delivery: [13.39, 52.55] },
  { pickup: [13.42, 52.51], delivery: [13.38, 52.54] },
  { pickup: [13.43, 52.52], delivery: [13.37, 52.53] },
  { pickup: [13.44, 52.53], delivery: [13.36, 52.52] },
  { pickup: [13.45, 52.54], delivery: [13.35, 52.51] },
  { pickup: [13.34, 52.55], delivery: [13.33, 52.50] },
  { pickup: [13.32, 52.52], delivery: [13.31, 52.53] },
  { pickup: [13.30, 52.51], delivery: [13.29, 52.54] },
  { pickup: [13.28, 52.50], delivery: [13.27, 52.55] },
  { pickup: [13.26, 52.53], delivery: [13.25, 52.52] },
  { pickup: [13.24, 52.54], delivery: [13.23, 52.51] },
  { pickup: [13.22, 52.55], delivery: [13.21, 52.50] },
  { pickup: [13.20, 52.52], delivery: [13.19, 52.53] },
  { pickup: [13.18, 52.51], delivery: [13.17, 52.54] },
];

shipmentCoords.forEach(({ pickup, delivery }, i) => {
  const shipment = new Shipment()
    .setId(`shipment-${i + 1}`)
    .setPickup(new ShipmentStep().setLocation(pickup[0], pickup[1]).setDuration(60))
    .setDelivery(new ShipmentStep().setLocation(delivery[0], delivery[1]).setDuration(60));

  planner.addShipment(shipment);
});
```

---

## 5. Plan and Analyze

```ts
const result = await planner.setMode("drive").plan();

result.getAgentSolutions().forEach((agent) => {
  console.log(`Agent: ${agent.getAgentId()}`);
  agent.getActions().forEach((action) => {
    console.log(` - ${action.getType()} shipment ${action.getShipmentId()} at ${action.getStartTime()}s`);
  });
});
```

---

## Result

You now have an optimized plan that distributes 20 shipments across 3 agents, balancing their travel time and minimizing route overlap.

To visualize the output, see [`RoutePlannerTimeline`](../api/route-planner-timeline.md).

For editing the result manually, use [`RoutePlannerResultEditor`](../api/route-planner-result-editor.md).

---

## See Also

* [API Overview](../api/index.md)
* [Optimizing with Jobs](./optimizing-two-agents.md)
* [SDK Playground](https://apidocs.geoapify.com/playground/route-planner/)
