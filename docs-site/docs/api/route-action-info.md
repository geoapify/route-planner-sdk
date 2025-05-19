# `RouteActionInfo`

The `RouteActionInfo` class is a container that links a set of `RouteAction`s with the agent who performs them. It provides a quick and consolidated view of what an agent is doing along the route, including both the agent identity and their full list of actions.

This is useful when you need to analyze or display route activities grouped by agent.

---

## Purpose

Use `RouteActionInfo` to:

- Group route actions by agent
- Retrieve a full list of execution steps for a specific agent
- Access the associated `AgentSolution` context directly
- Build Gantt charts, timelines, or dashboards per agent

---

## Constructor

```ts
new RouteActionInfo(raw: RouteActionInfoData)
```

Initializes a `RouteActionInfo` object. Throws an error if raw input is missing.

---

## Methods

| Method         | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `getRaw()`     | Returns the internal `RouteActionInfoData` object                       |
| `getAgentId()` | Returns the `id` of the agent                                           |
| `getActions()` | Returns an array of [`RouteAction`](./route-action.md) objects          |
| `getAgent()`   | Returns the corresponding [`AgentSolution`](./agent-solution.md) object |

---

## Example

```ts
const actionInfo = new RouteActionInfo(data);

console.log("Agent:", actionInfo.getAgentId());
const actions = actionInfo.getActions();

actions.forEach((action) => {
  console.log(action.getType(), action.getStartTime());
});
```

This helps you visualize all route activities for an agent in sequence.

---

## Related

* [`RouteAction`](./route-action.md) – individual route steps
* [`AgentSolution`](./agent-solution.md) – full route and timeline for the agent
* [`RoutePlannerResult`](./route-planner-result.md) – top-level access to all solutions