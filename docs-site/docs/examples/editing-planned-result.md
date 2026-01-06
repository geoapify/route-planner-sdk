# Example: Editing Planned Result After Optimization

In this example, we'll:

* Execute a route optimization
* Inspect the result
* Reassign a job from one agent to another using the `RoutePlannerResultEditor`
* Use different strategies for modifications

This is useful when you want to manually adjust plans based on real-world constraints (like agent availability or new priorities).

---

## 1. Import the SDK

```ts
import RoutePlanner, { Agent, Job, RoutePlannerResultEditor } from "@geoapify/route-planner-sdk";
```

---

## 2. Initialize Planner and Add Input

```ts
const planner = new RoutePlanner({ apiKey: "YOUR_API_KEY" });

planner
  .setMode("drive")
  .addAgent(new Agent().setId("agent-1").setStartLocation(13.40, 52.52))
  .addAgent(new Agent().setId("agent-2").setStartLocation(13.42, 52.50))
  .addJob(new Job().setId("job-1").setLocation(13.41, 52.51))
  .addJob(new Job().setId("job-2").setLocation(13.39, 52.53));
```

---

## 3. Plan the Route

```ts
const result = await planner.plan();
```

---

## 4. View Initial Assignments

```ts
result.getAgentSolutions().forEach(agent => {
  console.log(`Agent: ${agent.getAgentId()}`);
  agent.getActions().forEach(action => {
    console.log(` - ${action.getType()} ${action.getJobId()}`);
  });
});
```

---

## 5. Reassign a Job to Another Agent

Let's say we want to reassign `job-1` from `agent-1` to `agent-2`:

```ts
const editor = new RoutePlannerResultEditor(result);

// Default: full reoptimization
await editor.assignJobs("agent-2", ["job-1"]);

const updatedResult = editor.getModifiedResult();
```

---

## 6. Using Different Strategies

The editor supports different strategies depending on your needs:

### Append Strategy (Fast, No API Call)

Use when you want to quickly add to the end of a route without optimization:

```ts
const editor = new RoutePlannerResultEditor(result);

// Append job to end of agent's route
await editor.assignJobs("agent-2", ["job-1"], { strategy: 'append' });
```

### Insert Strategy (Optimal Position)

Use when you want to find the best position without full reoptimization:

```ts
const editor = new RoutePlannerResultEditor(result);

// Insert at optimal position (uses Route Matrix API)
await editor.assignJobs("agent-2", ["job-1"], { strategy: 'insert' });

// Or insert at a specific position
await editor.assignJobs("agent-2", ["job-1"], { 
  strategy: 'insert', 
  afterId: 'job-2' 
});
```

### PreserveOrder Strategy (For Removal)

Use when removing jobs/shipments without reordering remaining stops:

```ts
const editor = new RoutePlannerResultEditor(result);

// Remove without reordering
await editor.removeJobs(["job-1"], { strategy: 'preserveOrder' });
```

---

## 7. View Modified Assignments

```ts
console.log("Modified solution:");

updatedResult.getAgentSolutions().forEach(agent => {
  console.log(`Agent: ${agent.getAgentId()}`);
  agent.getActions().forEach(action => {
    console.log(` - ${action.getType()} ${action.getJobId()}`);
  });
});
```

---

## Strategy Comparison

| Strategy | Speed | API Calls | Best For |
|----------|-------|-----------|----------|
| `reoptimize` | Slowest | Yes (Route Planner API) | Finding optimal route |
| `insert` | Medium | Yes (Route Matrix API) | Quick optimal insertion |
| `append` | Fastest | No | Real-time UI updates |
| `preserveOrder` | Fastest | No | Quick removal |

---

## Summary

This example shows how you can:

* Automatically optimize a plan
* Manually override assignments using editor tools
* Choose the right strategy based on your needs

This gives you the flexibility to combine automated and human planning.

For more editor capabilities, see [`RoutePlannerResultEditor`](../api/route-planner-result-editor.md).
