# Migration From V1 to V2

This guide covers the main API changes needed to migrate from the V1 SDK surface to V2.

## AI Prompt for Migration (Codex /  / Similar)

Use this prompt with your coding assistant when you want it to migrate a custom project (that uses the library) from V1 APIs to V2 APIs after updating the dependency.

```text
You are working in a custom project that uses @geoapify/route-planner-sdk and needs migration to V2 after dependency update.
Do not change the library source code itself; only change the project code that consumes the library.

Goal:
Migrate V1 API usage to V2 API usage in the requested files only.

V1 -> V2 mapping to apply:
- AgentSolution -> AgentPlan
- JobSolution -> JobPlan
- ShipmentSolution -> ShipmentPlan
- RoutePlannerResult.getRawData() -> getRaw()
- RoutePlannerResult.getOptions() -> getCallOptions()
- RoutePlannerResult.getAgentSolutions() -> getAgentPlans()
- RoutePlannerResult.getAgentSolution(x) -> getAgentPlan(x)
- RoutePlannerResult.getJobSolutions() -> getJobPlans()
- RoutePlannerResult.getJobSolution(x) -> getJobPlan(x)
- RoutePlannerResult.getShipmentSolutions() -> getShipmentPlans()
- RoutePlannerResult.getShipmentSolution(x) -> getShipmentPlan(x)
- RoutePlannerResult.getAgentRoute(...) -> result.getAgentPlan(...).getRoute(...)
- RoutePlannerResultEditor assign/add/remove methods: use options objects instead of numeric third arg
- addTimeOffsetAfterWaypoint(...) -> addDelayAfterWaypoint(...) (keep alias only when explicitly requested)
- InvalidParameterType -> InvalidParameter

Constraints:
1. Keep behavior unchanged unless migration requires API renames/signature updates.
2. Do not refactor unrelated code.
3. Update tests for changed API usage.
4. Update docs that still mention V1 methods/classes.
5. Summarize:
   - files changed
   - exact replacements made
   - commands run
   - test results
   - any remaining V1 references

Execution workflow:
1. Scan target paths for V1 symbols.
2. Propose a short migration plan.
3. Apply changes in small, reviewable diffs.
4. Run targeted tests.
5. Report unresolved edge cases/questions.
```

## Quick Checklist

- Update planner constructor typing/usages:
  - use `RoutePlannerCallOptions` for constructor options
  - pass `RoutePlannerInputData` directly when you already have API input JSON
- Replace `*Solution` result classes with `*Plan` classes.
- Update `RoutePlannerResult` method calls (`getRawData()` -> `getRaw()`, etc.).
- Update `RoutePlannerResultEditor` calls to use options objects instead of a numeric 3rd argument.
- Switch from `addTimeOffsetAfterWaypoint()` to `addDelayAfterWaypoint()` (old method is still available as a deprecated alias).
- If you catch editor validation errors, use `InvalidParameter`.
- Update route result data interface names:
  - `LegResponseData` -> `RouteLegData`
  - `LegStepResponseData` -> `RouteLegStepData`
  - `WaypointResponseData` -> `WaypointData`
- If you use deep internal imports, move `nested/result/*` paths to `nested/response/*`.

## 1. RoutePlanner Construction

Use `RoutePlannerCallOptions` for constructor options, and pass a raw `RoutePlannerInputData` object when you already store API payloads in JSON.

```ts
// Current
const planner = new RoutePlanner({ apiKey: process.env.GEOAPIFY_API_KEY! });
```

or

```ts
// Current (direct JSON-based initialization)
const planner = new RoutePlanner(
  { apiKey: process.env.GEOAPIFY_API_KEY! },
  routePlannerInputJson
);
```

## 2. Result Model Renames

V1 returned/used solution-style entities. The current API uses plan-style entities.

| V1 | Current |
|---|---|
| `AgentSolution` | `AgentPlan` |
| `JobSolution` | `JobPlan` |
| `ShipmentSolution` | `ShipmentPlan` |

### RoutePlannerResult Method Mapping

| V1 method | Current method |
|---|---|
| `getRawData()` | `getRaw()` |
| `getOptions()` | `getCallOptions()` |
| `getAgentSolutions()` | `getAgentPlans()` |
| `getAgentSolution(idOrIndex)` | `getAgentPlan(idOrIndex)` |
| `getJobSolutions()` | `getJobPlans()` |
| `getJobSolution(idOrIndex)` | `getJobPlan(idOrIndex)` |
| `getShipmentSolutions()` | `getShipmentPlans()` |
| `getShipmentSolution(idOrIndex)` | `getShipmentPlan(idOrIndex)` |

### Result Interface Renames

These data interfaces were normalized to non-`Response` names:

| Old | Current |
|---|---|
| `LegResponseData` | `RouteLegData` |
| `LegStepResponseData` | `RouteLegStepData` |
| `WaypointResponseData` | `WaypointData` |

If your project imports internal SDK paths directly (not recommended), note that route-result interfaces now live under `src/models/interfaces/nested/response`.

### Accessing Waypoints/Actions/Legs

V1 convenience methods such as `getAgentWaypoints()`, `getAgentRouteActions()`, and `getAgentRouteLegs()` were replaced by access through `AgentPlan`.

```ts
// V1
const waypoints = result.getAgentWaypoints("agent-1");

// Current
const waypoints = result.getAgentPlan("agent-1")?.getWaypoints() ?? [];
```

## 3. Route Fetching Change

`RoutePlannerResult.getAgentRoute(...)` moved to `AgentPlan.getRoute(...)`.

```ts
// V1
const route = await result.getAgentRoute("agent-1", options);

// Current
const route = await result.getAgentPlan("agent-1")?.getRoute(options);
```

## 4. Editor API Changes

`RoutePlannerResultEditor` now uses strategy/options objects for add/assign/remove flows.

### Assign/Remove Signature Change

| V1 | Current |
|---|---|
| `assignJobs(agent, jobs, priority?)` | `assignJobs(agent, jobs, options?)` |
| `assignShipments(agent, shipments, priority?)` | `assignShipments(agent, shipments, options?)` |
| `removeJobs(jobs)` | `removeJobs(jobs, options?)` |
| `removeShipments(shipments)` | `removeShipments(shipments, options?)` |
| `addNewJobs(agent, jobs)` | `addNewJobs(agent, jobs, options?)` |
| `addNewShipments(agent, shipments)` | `addNewShipments(agent, shipments, options?)` |

Example:

```ts
// V1
await editor.assignJobs("agent-A", ["job-1"], 100);

// Current
await editor.assignJobs("agent-A", ["job-1"], {
  strategy: "preserveOrder",
  append: true
});
```

Notes:

- Numeric priority as the 3rd argument is no longer part of the assign signatures.
- `append` is the current flag used for direct insertion/append behavior.

## 5. Delay API Rename

Prefer:

```ts
editor.addDelayAfterWaypoint(agentIdOrIndex, waypointIndex, delaySeconds);
```

Legacy alias (still works, deprecated):

```ts
editor.addTimeOffsetAfterWaypoint(agentIdOrIndex, waypointIndex, offsetSeconds);
```

## 6. New Editor Capabilities

The current editor also includes:

- `reoptimizeAgentPlan(agentIdOrIndex, options?)`
- `moveWaypoint(agentIdOrIndex, fromWaypointIndex, toWaypointIndex)`

## 7. Validation Error Rename

Use `InvalidParameter` for invalid input checks.  
`InvalidParameterType` was removed. Use `InvalidParameter`.

## Typical Migration Example

```ts
// V1 style
const agent = result.getAgentSolution("agent-1");
await editor.assignJobs("agent-1", ["job-3"], 10);

// Current style
const agent = result.getAgentPlan("agent-1");
await editor.assignJobs("agent-1", ["job-3"], { strategy: "reoptimize" });
```
