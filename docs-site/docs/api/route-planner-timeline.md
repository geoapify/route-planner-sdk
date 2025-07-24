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

### Getter and Setter methods

| Method                                | Description                                   |
|--------------------------------------|-----------------------------------------------|
| `getHasLargeDescription()`           | Checks whether agent info is displayed wide   |
| `setHasLargeDescription(value)`      | Toggles wide agent info display               |
| `getAgentColors()`                   | Returns the current color palette             |
| `setAgentColors(value)`              | Sets the color palette for agents             |
| `getCapacityUnit()`                  | Returns the shipment capacity unit            |
| `setCapacityUnit(value)`             | Sets the shipment capacity unit (e.g., "items")|
| `getTimeLabels()` / `setTimeLabels()`| Manage vertical timeline markers for time     |
| `getDistanceLabels()` / `setDistanceLabels()` | Manage vertical markers for distance    |
| `getAgentLabel()` / `setAgentLabel()`| Set or get the text label for agents          |

---

## Events

| Event             | Trigger                                          |
| ----------------- | ------------------------------------------------ |
| `onWaypointHover` | Mouse hovers over a job/waypoint item            |
| `beforeAgentMenuShow`  | Before displaying the agent's context menu (modify items when needed) |

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

// Optional: Modify menu items dynamically before they are shown
timeline.on('beforeAgentMenuShow', (agentIndex: number, actions: TimelineMenuItem[]) => {
  return actions.map(action => {
    if (action.key === 'show-hide-agent') {
      return {
        ...action,
        label: this.agentVisibilityState[agentIndex] ? 'Show Route' : 'Hide Route'
      };
    }
    return action;
  });
});
```

---

## Advanced Features

### Waypoint Popups

* Use `waypointPopupGenerator` to provide custom HTML tooltips
* Supports global hover tooltips or popup components

### Styling

The timeline component generates a number of CSS classes that can be customized to match your own design system:

* `.geoapify-rp-sdk-timeline-item` – main container for each agent’s timeline row  
  * Each item also receives an additional class of the form `agent-{index}` (e.g., `agent-0`, `agent-1`), allowing per-agent styling. For example, you can visually indicate agents hidden on the map by applying a CSS rule that greys out their timeline row.
* `.geoapify-rp-sdk-agent-info` – container for agent label and description  
* `.geoapify-rp-sdk-solution-item` – represents individual jobs, shipments, or waypoints on the timeline  
* `.geoapify-rp-sdk-three-dot-menu`, `.geoapify-rp-sdk-menu-list`, `.geoapify-rp-sdk-menu-item` – used for agent context menu controls  
* `.geoapify-rp-sdk-custom-tooltip` – tooltip container for waypoint hover popups  

All these classes can be fully customized or overridden with your own stylesheet to match branding or UX requirements.

---

## Related

* [`RoutePlannerResult`](./route-planner-result.md)
* [`AgentSolution`](./agent-solution.md)
* [`Waypoint`](./waypoint.md)
* [`TimelineMenuItem`](./types.md#timelinemenuitem)
* [`RoutePlannerTimelineOptions`](./types.md#routeplannertimelineoptions)