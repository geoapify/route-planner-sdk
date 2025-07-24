# `RoutePlannerTimeline`

The `RoutePlannerTimeline` class provides a ready-to-use UI component to **visualize agent schedules and routes** as horizontal timelines — either by time or by distance.

![Timeline example](https://github.com/geoapify/route-planner-sdk/blob/main/img/timeline.png?raw=true)

This component helps planners and dispatchers understand how jobs and shipments are distributed across agents and when they are executed.


---

## Purpose

Use `RoutePlannerTimeline` to:

* Display each agent's route visually as a horizontal bar
* Show time-based or distance-based activity
* Present tooltips and popups with task details
* Add interactive agent menu controls
* Integrate route insights into dashboards or planning tools



---

## Constructor

```ts
new RoutePlannerTimeline(container: HTMLElement, inputData?: RoutePlannerInputData, result?: RoutePlannerResult, options?: RoutePlannerTimelineOptions)
```

* `container` – a DOM element that receives the generated timeline HTML
* `inputData` – optional route planner input (for preview mode)
* `result` – optional result of the planned routes
* `options` – visualization options like colors, labels, layout type

---

## Visualization Modes

| Option                         | Description                                             |
| ------------------------------ | ------------------------------------------------------- |
| `timelineType`                 | `'time'` (default) or `'distance'`                      |
| `agentColors`                  | Color palette for agents                                |
| `capacityUnit`                 | Text label for shipment units                           |
| `agentMenuItems`               | Agent-level 3-dot dropdown actions (e.g., Edit, Remove) |
| `timeLabels`, `distanceLabels` | Optional vertical markers                               |
| `waypointPopupGenerator`       | Optional function to customize popups on hover          |

---

## Timeline Behavior

| Method                     | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `setTimelineType(type)`    | Switch between `'time'` and `'distance'` views |
| `setResult(result)`        | Re-render timeline using new result            |
| `setAgentMenuItems(items)` | Update agent-specific menu dropdowns           |
| `refreshTimelines()`       | Re-render the timeline (useful after data changes) |
| `on(event, handler)`       | Listen to events like `onWaypointHover`        |
| `off(event, handler)`      | Unbind timeline events                         |

---

## Events

| Event             | Trigger                                          |
| ----------------- | ------------------------------------------------ |
| `onWaypointHover` | Mouse hovers over a job/waypoint item            |
| (custom)          | Your menu actions via `agentMenuItems` callbacks |

---

## Example

```ts
const container = document.getElementById("timeline");
const timeline = new RoutePlannerTimeline(container, inputData, result, {
  timelineType: "time",
  agentLabel: "Driver",
  agentMenuItems: [
    { key: "edit", label: "Edit", callback: (agentIndex) => console.log("Edit", agentIndex) }
  ]
});

timeline.on("onWaypointHover", (waypoint) => {
  console.log("Hovered over:", waypoint.getLocation());
});
```

---

## Advanced Features

### Waypoint Popups

* Use `waypointPopupGenerator` to provide custom HTML tooltips
* Supports global hover tooltips or popup components

### Styling

* Applies CSS classes like `.geoapify-rp-sdk-solution-item`, `.geoapify-rp-sdk-menu-item`, and `.geoapify-rp-sdk-tooltip`
* Can be fully styled via your own stylesheet

---

## Related

* [`RoutePlannerResult`](./route-planner-result.md)
* [`AgentSolution`](./agent-solution.md)
* [`Waypoint`](./waypoint.md)
* [`TimelineMenuItem`](./types.md#timelinemenuitem)
* [`RoutePlannerTimelineOptions`](./types.md#routeplannertimelineoptions)