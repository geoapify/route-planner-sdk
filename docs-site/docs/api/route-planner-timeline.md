# RoutePlannerTimeline

This page documents the `RoutePlannerTimeline` class from the `@geoapify/route-planner-sdk` library — including setup, configuration, and all available methods.
Use it to **visualize agent schedules and routes** as interactive horizontal timelines, either by time or by distance.

![Timeline example](https://github.com/geoapify/route-planner-sdk/blob/main/img/timeline.png?raw=true)

## Constructor

```typescript
constructor(
  container: HTMLElement, 
  inputData?: RoutePlannerInputData, 
  result?: RoutePlannerResult, 
  options?: RoutePlannerTimelineOptions
)
```

Creates a new **RoutePlannerTimeline** instance and renders it into the specified container element.

Here are the parameters you can pass to the constructor:

| Name | Type | Description |
|------|------|-------------|
| `container` | `HTMLElement` | The DOM element where the timeline will be rendered |
| `inputData` | [`RoutePlannerInputData`](./route-planner.md#routeplannerinputdata) *(optional)* | Route planner input data (for preview mode without results) |
| `result` | [`RoutePlannerResult`](./route-planner-result.md) *(optional)* | The optimized route result to visualize |
| `options` | [`RoutePlannerTimelineOptions`](#routeplannertimelineoptions) *(optional)* | Configuration options for appearance and behavior |

Here's a basic example of how to create a timeline:

```typescript
import { RoutePlannerTimeline } from '@geoapify/route-planner-sdk';

const container = document.getElementById('timeline');
const timeline = new RoutePlannerTimeline(container, inputData, result, {
  timelineType: 'time',
  agentLabel: 'Driver',
  showWaypointPopup: true
});
```

## Methods

The `RoutePlannerTimeline` class provides methods to update the timeline, configure display options, and listen to events.

| Method | Signature | Purpose |
|--------|-----------|---------|
| [`setResult`](#setresult) | `setResult(result: RoutePlannerResult): void` | Update timeline with new result |
| [`setTimelineType`](#settimelinetype) | `setTimelineType(type: 'time' \| 'distance'): void` | Switch between time/distance views |
| [`setAgentMenuItems`](#setagentmenuitems) | `setAgentMenuItems(items: TimelineMenuItem[]): void` | Update agent dropdown menu |
| [`on`](#on) | `on(event, handler): void` | Subscribe to timeline events |
| [`off`](#off) | `off(event, handler): void` | Unsubscribe from events |
| `getHasLargeDescription` / `setHasLargeDescription` | Getter/Setter | Check or toggle wide agent info display |
| `getAgentColors` / `setAgentColors` | Getter/Setter | Get or set agent color palette |
| `getCapacityUnit` / `setCapacityUnit` | Getter/Setter | Get or set capacity unit label |
| `getTimeLabels` / `setTimeLabels` | Getter/Setter | Get or set time axis labels |
| `getDistanceLabels` / `setDistanceLabels` | Getter/Setter | Get or set distance axis labels |
| `getAgentLabel` / `setAgentLabel` | Getter/Setter | Get or set agent label text |

Here's the detailed version of method descriptions:

### setResult()

Signature: `setResult(result: RoutePlannerResult): void`

Updates the timeline to display a new route planning result. Use this after modifying the result with `RoutePlannerResultEditor`.

**Example:**

```typescript
const modifiedResult = editor.getModifiedResult();
timeline.setResult(modifiedResult);
```

### setTimelineType()

Signature: `setTimelineType(type: 'time' | 'distance'): void`

Switches between time-based and distance-based visualization.

**Example:**

```typescript
timeline.setTimelineType('time');     // Show by time
timeline.setTimelineType('distance'); // Show by distance
```

### setAgentMenuItems()

Signature: `setAgentMenuItems(items: TimelineMenuItem[]): void`

Updates the dropdown menu items shown when clicking the three-dot menu on each agent row.

**Example:**

```typescript
timeline.setAgentMenuItems([
  {
    key: 'edit',
    label: 'Edit Agent',
    callback: (agentIndex) => openEditDialog(agentIndex)
  },
  {
    key: 'hide',
    label: 'Hide on Map',
    callback: (agentIndex) => toggleVisibility(agentIndex)
  }
]);
```

### on()

Signature: `on(event: string, handler: Function): void`

Subscribes to timeline events.

**Example:**

```typescript
timeline.on('onWaypointHover', (waypoint, agentIndex) => {
  console.log('Hovered:', waypoint.getLocation());
});

timeline.on('onWaypointClick', (waypoint, agentIndex) => {
  showWaypointDetails(waypoint);
});

timeline.on('beforeAgentMenuShow', (agentIndex, actions) => {
  // Modify menu items before showing
  return actions.map(action => ({
    ...action,
    disabled: agentIndex === 0
  }));
});
```

### off()

Signature: `off(event: string, handler?: Function): void`

Unsubscribes from timeline events. If no handler is provided, removes all handlers for the event.

**Example:**

```typescript
const handler = (waypoint) => console.log(waypoint);
timeline.on('onWaypointClick', handler);

// Later, unsubscribe
timeline.off('onWaypointClick', handler);
```

### getHasLargeDescription() / setHasLargeDescription()

Signature: `getHasLargeDescription(): boolean` / `setHasLargeDescription(value: boolean): void`

Gets or sets whether agent information is displayed in a wider format.

**Example:**

```typescript
const isLarge = timeline.getHasLargeDescription();
timeline.setHasLargeDescription(true);
```

### getAgentColors() / setAgentColors()

Signature: `getAgentColors(): string[]` / `setAgentColors(colors: string[]): void`

Gets or sets the color palette used for agent rows.

**Example:**

```typescript
timeline.setAgentColors(['#ff4d4d', '#1a8cff', '#00cc66', '#b300b3']);
```

### getCapacityUnit() / setCapacityUnit()

Signature: `getCapacityUnit(): string` / `setCapacityUnit(unit: string): void`

Gets or sets the unit label displayed for capacity values.

**Example:**

```typescript
timeline.setCapacityUnit('kg');
timeline.setCapacityUnit('items');
```

### getTimeLabels() / setTimeLabels()

Signature: `getTimeLabels(): RoutePlannerTimelineLabel[]` / `setTimeLabels(labels: RoutePlannerTimelineLabel[]): void`

Gets or sets vertical markers for the time axis.

**Example:**

```typescript
timeline.setTimeLabels([
  { position: '25%', label: '1h' },
  { position: '50%', label: '2h' },
  { position: '75%', label: '3h' }
]);
```

### getDistanceLabels() / setDistanceLabels()

Signature: `getDistanceLabels(): RoutePlannerTimelineLabel[]` / `setDistanceLabels(labels: RoutePlannerTimelineLabel[]): void`

Gets or sets vertical markers for the distance axis.

**Example:**

```typescript
timeline.setDistanceLabels([
  { position: '25%', label: '5 km' },
  { position: '50%', label: '10 km' },
  { position: '75%', label: '15 km' }
]);
```

### getAgentLabel() / setAgentLabel()

Signature: `getAgentLabel(): string` / `setAgentLabel(label: string): void`

Gets or sets the label text used for agents (e.g., "Driver", "Truck", "Courier").

**Example:**

```typescript
timeline.setAgentLabel('Delivery Van');
```

## Listening For Events

The `RoutePlannerTimeline` component emits various events for user interactions.

| Event | Payload | Fired when... |
|-------|---------|---------------|
| `onWaypointHover` | `(waypoint: Waypoint, agentIndex: number)` | Mouse hovers over a waypoint |
| `onWaypointClick` | `(waypoint: Waypoint, agentIndex: number)` | Mouse clicks a waypoint |
| `beforeAgentMenuShow` | `(agentIndex: number, actions: TimelineMenuItem[])` | Before showing agent context menu |

**Example: Handling events**

```typescript
// Waypoint hover - update map highlight
timeline.on('onWaypointHover', (waypoint, agentIndex) => {
  highlightOnMap(waypoint.getLocation());
});

// Waypoint click - show details panel
timeline.on('onWaypointClick', (waypoint, agentIndex) => {
  showDetailsPanel({
    location: waypoint.getLocation(),
    duration: waypoint.getDuration(),
    actions: waypoint.getActions()
  });
});

// Modify menu items dynamically
timeline.on('beforeAgentMenuShow', (agentIndex, actions) => {
  return actions.map(action => {
    if (action.key === 'toggle-visibility') {
      return {
        ...action,
        label: isAgentVisible(agentIndex) ? 'Hide Route' : 'Show Route'
      };
    }
    return action;
  });
});
```

## Options Interface

### RoutePlannerTimelineOptions

Configuration options for timeline appearance and behavior.

```typescript
interface RoutePlannerTimelineOptions {
  /** Display mode: 'time' (default) or 'distance' */
  timelineType?: 'time' | 'distance';
  
  /** Enable wider agent info display */
  hasLargeDescription?: boolean;
  
  /** Unit label for capacity (e.g., 'kg', 'items') */
  capacityUnit?: string;
  
  /** Label for agents (e.g., 'Driver', 'Truck') */
  agentLabel?: string;
  
  /** Main title for the timeline */
  label?: string;
  
  /** Description text below the title */
  description?: string;
  
  /** Vertical markers for time axis */
  timeLabels?: RoutePlannerTimelineLabel[];
  
  /** Vertical markers for distance axis */
  distanceLabels?: RoutePlannerTimelineLabel[];
  
  /** Color palette for agents */
  agentColors?: string[];
  
  /** Show popup on waypoint hover */
  showWaypointPopup?: boolean;
  
  /** Custom popup generator function */
  waypointPopupGenerator?: (waypoint: Waypoint) => HTMLElement;
  
  /** Dropdown menu items for each agent */
  agentMenuItems?: TimelineMenuItem[];
}
```

### TimelineMenuItem

Menu item configuration for agent dropdown menus.

```typescript
interface TimelineMenuItem {
  /** Unique identifier for the menu item */
  key: string;
  
  /** Display text */
  label?: string;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Whether the item is hidden */
  hidden?: boolean;
  
  /** Callback when clicked */
  callback: (agentIndex: number) => void;
}
```

### RoutePlannerTimelineLabel

Label configuration for axis markers.

```typescript
interface RoutePlannerTimelineLabel {
  /** Position as percentage (e.g., '25%', '50%') */
  position: string;
  
  /** Label text to display */
  label: string;
}
```

## Styling

The timeline component generates CSS classes that can be customized:

| Class | Purpose |
|-------|---------|
| `.geoapify-rp-sdk-timeline-item` | Main container for each agent's timeline row |
| `.geoapify-rp-sdk-timeline-item.agent-{index}` | Per-agent styling (e.g., `agent-0`, `agent-1`) |
| `.geoapify-rp-sdk-agent-info` | Container for agent label and description |
| `.geoapify-rp-sdk-solution-item` | Individual jobs, shipments, or waypoints |
| `.geoapify-rp-sdk-three-dot-menu` | Three-dot menu button |
| `.geoapify-rp-sdk-menu-list` | Dropdown menu container |
| `.geoapify-rp-sdk-menu-item` | Individual menu items |
| `.geoapify-rp-sdk-custom-tooltip` | Tooltip container for waypoint hover |

**Example: Custom styling**

```css
/* Grey out hidden agents */
.geoapify-rp-sdk-timeline-item.agent-hidden {
  opacity: 0.5;
}

/* Custom waypoint colors */
.geoapify-rp-sdk-solution-item.pickup {
  background: #27ae60;
}

.geoapify-rp-sdk-solution-item.delivery {
  background: #e74c3c;
}
```

## Complete Example

```typescript
import { RoutePlannerTimeline, Waypoint, TimelineMenuItem } from '@geoapify/route-planner-sdk';

const container = document.getElementById('timeline');

// Custom popup generator
const popupGenerator = (waypoint: Waypoint): HTMLElement => {
  const div = document.createElement('div');
  div.innerHTML = `
    <strong>${waypoint.getActions().map(a => a.getType()).join(' / ')}</strong>
    <p>Duration: ${waypoint.getDuration()}s</p>
    <p>Start: ${waypoint.getStartTime()}s</p>
  `;
  return div;
};

// Menu items
const menuItems: TimelineMenuItem[] = [
  {
    key: 'details',
    label: 'View Details',
    callback: (index) => showAgentDetails(index)
  },
  {
    key: 'toggle',
    label: 'Toggle Visibility',
    callback: (index) => toggleAgent(index)
  }
];

// Create timeline
const timeline = new RoutePlannerTimeline(container, inputData, result, {
  timelineType: 'time',
  agentLabel: 'Courier',
  label: 'Delivery Schedule',
  description: 'Daily delivery routes for all couriers',
  showWaypointPopup: true,
  waypointPopupGenerator: popupGenerator,
  agentMenuItems: menuItems,
  agentColors: ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6'],
  timeLabels: [
    { position: '25%', label: '2h' },
    { position: '50%', label: '4h' },
    { position: '75%', label: '6h' }
  ]
});

// Listen for events
timeline.on('onWaypointClick', (waypoint, agentIndex) => {
  console.log(`Clicked waypoint for agent ${agentIndex}`);
});
```

## Learn More

* [`RoutePlannerResult`](./route-planner-result.md) — The result object used for visualization
* [`AgentSolution`](./agent-solution.md) — Agent-level solution data
* [`Waypoint`](./waypoint.md) — Individual waypoint details
