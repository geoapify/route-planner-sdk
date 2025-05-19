# `Break`

The `Break` class defines a time window where an agent should take a break during their working schedule. Breaks help enforce legal working conditions or schedule rest periods into the route plan.

They are used as part of an agent's configuration and factored into the optimization just like jobs and shipments.

---

## Purpose

Use this class to specify:

- **When** an agent can take a break (via `time_windows`)
- **How long** the break should last (via `duration`)

Breaks are optional but provide realistic and practical routing solutions — especially for long shifts or regulated delivery operations.

---

## Constructor

```ts
new Break(raw?: BreakData)
```

Creates a new break configuration. If no data is passed, initializes with an empty time window list.

---

## Methods

| Method                      | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| `getRaw()`                  | Returns the underlying `BreakData` object                |
| `setRaw(data)`              | Replaces the break configuration entirely                |
| `setDuration(duration)`     | Sets the required break duration (in seconds)            |
| `addTimeWindow(start, end)` | Adds a time window (in seconds) when the break may occur |

> Time windows are expressed as relative seconds from the start of the planning task.

---

## Example

```ts
import { Break } from "@geoapify/route-planner-sdk";

const rest = new Break()
  .setDuration(1800) // 30 minutes
  .addTimeWindow(14400, 18000) // Between 4th and 5th hour
  .addTimeWindow(28800, 32400); // Between 8th and 9th hour
```

In this example, the break can happen in either window, and the route planner will choose the best fit based on the route.

---

## Related

* [`Agent`](./agent.md) – breaks are added to agent schedules
* [`RoutePlanner`](./route-planner.md) – uses agent definitions during planning
