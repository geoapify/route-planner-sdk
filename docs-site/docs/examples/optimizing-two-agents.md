# Example: Optimizing Delivery Routes with Two Agents

This example demonstrates how to use the Geoapify Route Optimization SDK to:
- Define multiple delivery jobs
- Assign two delivery agents
- Send a request to the Route Planner API
- Print the optimized job sequence for each agent

---

## Step-by-Step Guide

### 1. Import the SDK

Install the SDK via npm:

```bash
npm install @geoapify/route-planner-sdk
```

Then import it in your TypeScript project:

```ts
import RoutePlanner, { Agent, Job } from "@geoapify/route-planner-sdk";
```

---

### 2. Create Your Planner Instance

You need to pass your API key:

```ts
const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" });
```

---

### 3. Define Agents

Each agent has a unique `id` and a starting location (longitude, latitude). You can also define working hours or vehicle capacity.

```ts
planner
  .addAgent(new Agent()
    .setId("agent-1")
    .setStartLocation(13.4050, 52.5200))  // Berlin
  .addAgent(new Agent()
    .setId("agent-2")
    .setStartLocation(13.3889, 52.5170)); // Berlin Mitte
```

---

### 4. Add Jobs

Each job is a delivery task. Specify location and optional details like duration or priority.

```ts
planner
  .addJob(new Job().setId("job-1").setLocation(13.4105, 52.5190))
  .addJob(new Job().setId("job-2").setLocation(13.3969, 52.5145))
  .addJob(new Job().setId("job-3").setLocation(13.4285, 52.5232));
```

---

### 5. Plan the Route

Call `.plan()` to send the request and receive an optimized route plan.

```ts
const result = await planner.setMode("drive").plan();
```

---

### 6. Inspect the Result

Print a simplified summary of the plan:

```ts
for (const agent of result.getAgentSolutions()) {
  console.log(`Agent: ${agent.getAgentId()}`);
  for (const action of agent.getActions()) {
    console.log(` - ${action.getType()} at time ${action.getStartTime()}`);
  }
}
```

This will show when each agent starts, what actions they perform, and in what order.

---

## What's Next?

You can also:

* Visualize results with [`RoutePlannerTimeline`](../api/route-planner-timeline.md)
* Modify assignments using [`RoutePlannerResultEditor`](../api/route-planner-result-editor.md)
* Rebalance workload dynamically

For more details, visit the [API Overview](../api/index.md).
