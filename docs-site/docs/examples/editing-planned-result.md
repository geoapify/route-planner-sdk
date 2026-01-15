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

// Default: full reoptimization (Route Planner API)
await editor.assignJobs("agent-2", ["job-1"]);

const updatedResult = editor.getModifiedResult();
```

---

## 6. Using Different Strategies

The editor supports different strategies depending on your needs:

### Full Reoptimization (Route Planner API)

Use when you want the best possible route after changes:

```ts
const editor = new RoutePlannerResultEditor(result);

// Full reoptimization with Route Planner API
await editor.assignJobs("agent-2", ["job-1"], { strategy: 'reoptimize' });
```

### PreserveOrder Strategy

The `preserveOrder` strategy is flexible and provides three different behaviors:

#### 1. Find Optimal Insertion Point (Route Matrix API)

Use when you want a good position without reordering existing stops:

```ts
const editor = new RoutePlannerResultEditor(result);

// Find optimal insertion point using Route Matrix API
await editor.assignJobs("agent-2", ["job-1"], { strategy: 'preserveOrder' });
```

#### 2. Insert at Specific Position (No API Call)

Use when you know exactly where to place the item:

```ts
const editor = new RoutePlannerResultEditor(result);

// Insert after a specific job (no API call)
await editor.assignJobs("agent-2", ["job-1"], { 
  strategy: 'preserveOrder', 
  afterId: 'job-2' 
});

// Or insert after a specific waypoint
await editor.assignJobs("agent-2", ["job-1"], { 
  strategy: 'preserveOrder', 
  afterWaypointIndex: 0  // After start waypoint (first position)
});

// Or insert before a specific job
await editor.assignJobs("agent-2", ["job-1"], { 
  strategy: 'preserveOrder', 
  beforeId: 'job-3' 
});
```

#### 3. Append to End (No API Call, Fastest)

Use for quick UI updates or when order doesn't matter:

```ts
const editor = new RoutePlannerResultEditor(result);

// Append to end of route (no API call)
await editor.assignJobs("agent-2", ["job-1"], { 
  strategy: 'preserveOrder', 
  appendToEnd: true 
});
```

### PreserveOrder for Removal

Use when removing jobs/shipments without reordering remaining stops:

```ts
const editor = new RoutePlannerResultEditor(result);

// Remove without reordering (no API call)
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
| `reoptimize` | Slowest | Route Planner API | Finding optimal route |
| `preserveOrder` (no position) | Medium | Route Matrix API | Quick optimal insertion without reordering |
| `preserveOrder` (beforeId/afterId) | Fastest | None | Insert relative to job/shipment |
| `preserveOrder` (waypoint index) | Fastest | None | Insert at specific waypoint |
| `preserveOrder` (appendToEnd) | Fastest | None | Real-time UI updates |

---

## Summary

This example shows how you can:

* Automatically optimize a plan
* Manually override assignments using editor tools
* Choose the right strategy based on your needs:
  - **`reoptimize`** for best results (slower)
  - **`preserveOrder`** for flexible, fast modifications

This gives you the flexibility to combine automated and human planning.

For more editor capabilities, see [`RoutePlannerResultEditor`](../api/route-planner-result-editor.md).
