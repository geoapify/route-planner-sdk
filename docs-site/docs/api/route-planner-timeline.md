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
| `inputData` | [`RoutePlannerInputData`](./route-planner.md#routeplannerinputdata-interface) *(optional)* | Route planner input data (for preview mode without results) |
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
| [`getResult`](#getresult) | `getResult(): RoutePlannerResult \| undefined` | Get current result |
| [`setResult`](#setresult) | `setResult(result: RoutePlannerResult): void` | Update timeline with new result |
| [`getTimelineType`](#gettimelinetype) | `getTimelineType(): 'time' \| 'distance' \| undefined` | Get current timeline mode |
| [`setTimelineType`](#settimelinetype) | `setTimelineType(type: 'time' \| 'distance'): void` | Switch between time/distance views |
| [`getAgentMenuItems`](#getagentmenuitems) | `getAgentMenuItems(): TimelineMenuItem[] \| undefined` | Get current agent dropdown menu items |
| [`setAgentMenuItems`](#setagentmenuitems) | `setAgentMenuItems(items: TimelineMenuItem[]): void` | Update agent dropdown menu |
| [`on`](#on) | `on(event, handler): void` | Subscribe to timeline events |
| [`off`](#off) | `off(event, handler): void` | Unsubscribe from events |
| [`getHasLargeDescription`](#gethaslargedescription) | `getHasLargeDescription(): boolean \| undefined` | Get wide agent info mode |
| [`setHasLargeDescription`](#sethaslargedescription) | `setHasLargeDescription(value: boolean): void` | Set wide agent info mode |
| [`getAgentColors`](#getagentcolors) | `getAgentColors(): string[] \| undefined` | Get agent color palette |
| [`setAgentColors`](#setagentcolors) | `setAgentColors(colors: string[]): void` | Set agent color palette |
| [`getCapacityUnit`](#getcapacityunit) | `getCapacityUnit(): string \| undefined` | Get capacity unit label |
| [`setCapacityUnit`](#setcapacityunit) | `setCapacityUnit(unit: string \| undefined): void` | Set capacity unit label |
| [`getTimeLabels`](#gettimelabels) | `getTimeLabels(): RoutePlannerTimelineLabel[] \| undefined` | Get time axis labels |
| [`setTimeLabels`](#settimelabels) | `setTimeLabels(labels: RoutePlannerTimelineLabel[]): void` | Set time axis labels |
| [`getDistanceLabels`](#getdistancelabels) | `getDistanceLabels(): RoutePlannerTimelineLabel[] \| undefined` | Get distance axis labels |
| [`setDistanceLabels`](#setdistancelabels) | `setDistanceLabels(labels: RoutePlannerTimelineLabel[]): void` | Set distance axis labels |
| [`getShowTimelineLabels`](#getshowtimelinelabels) | `getShowTimelineLabels(): boolean \| undefined` | Get timeline labels visibility |
| [`setShowTimelineLabels`](#setshowtimelinelabels) | `setShowTimelineLabels(value: boolean): void` | Set timeline labels visibility |
| [`getAgentLabel`](#getagentlabel) | `getAgentLabel(): string \| undefined` | Get agent label text |
| [`setAgentLabel`](#setagentlabel) | `setAgentLabel(label: string): void` | Set agent label text |
| [`getAgentColorByIndex`](#getagentcolorbyindex) | `getAgentColorByIndex(index: number): string` | Resolve color from current palette |

Here's the detailed version of method descriptions:

### setResult()

Signature: `setResult(result: RoutePlannerResult): void`

Updates the timeline to display a new route planning result. Use this after modifying the result with `RoutePlannerResultEditor`.

**Example:**

```typescript
const modifiedResult = editor.getModifiedResult();
timeline.setResult(modifiedResult);
```

### getResult()

Signature: `getResult(): RoutePlannerResult | undefined`

Returns the currently attached result object.

```typescript
const result = timeline.getResult();
```

### getTimelineType()

Signature: `getTimelineType(): 'time' | 'distance' | undefined`

Returns current timeline mode.

```typescript
const mode = timeline.getTimelineType();
```

### setTimelineType()

Signature: `setTimelineType(type: 'time' | 'distance'): void`

Switches between time-based and distance-based visualization.

**Example:**

```typescript
timeline.setTimelineType('time');     // Show by time
timeline.setTimelineType('distance'); // Show by distance
```

### getAgentMenuItems()

Signature: `getAgentMenuItems(): TimelineMenuItem[] | undefined`

Returns currently configured menu items.

```typescript
const items = timeline.getAgentMenuItems();
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

### getHasLargeDescription()

Signature: `getHasLargeDescription(): boolean | undefined`

Returns whether agent information is displayed in a wider format.

```typescript
const isLarge = timeline.getHasLargeDescription();
```

### setHasLargeDescription()

Signature: `setHasLargeDescription(value: boolean): void`

Sets whether agent information is displayed in a wider format.

```typescript
timeline.setHasLargeDescription(true);
```

### getAgentColors()

Signature: `getAgentColors(): string[] | undefined`

Returns current color palette for agent rows.

```typescript
const colors = timeline.getAgentColors();
```

### setAgentColors()

Signature: `setAgentColors(colors: string[]): void`

Sets color palette used for agent rows.

```typescript
timeline.setAgentColors(['#ff4d4d', '#1a8cff', '#00cc66', '#b300b3']);
```

### getCapacityUnit()

Signature: `getCapacityUnit(): string | undefined`

Returns current unit label for capacity values.

```typescript
const unit = timeline.getCapacityUnit();
```

### setCapacityUnit()

Signature: `setCapacityUnit(unit: string | undefined): void`

Sets unit label for capacity values.

```typescript
timeline.setCapacityUnit('kg');
timeline.setCapacityUnit('items');
```

### getTimeLabels()

Signature: `getTimeLabels(): RoutePlannerTimelineLabel[] | undefined`

Returns current vertical markers for the time axis.

```typescript
const labels = timeline.getTimeLabels();
```

### setTimeLabels()

Signature: `setTimeLabels(labels: RoutePlannerTimelineLabel[]): void`

Sets vertical markers for the time axis.

```typescript
timeline.setTimeLabels([
  { position: '25%', label: '1h' },
  { position: '50%', label: '2h' },
  { position: '75%', label: '3h' }
]);
```

### getDistanceLabels()

Signature: `getDistanceLabels(): RoutePlannerTimelineLabel[] | undefined`

Returns current vertical markers for the distance axis.

```typescript
const labels = timeline.getDistanceLabels();
```

### setDistanceLabels()

Signature: `setDistanceLabels(labels: RoutePlannerTimelineLabel[]): void`

Sets vertical markers for the distance axis.

```typescript
timeline.setDistanceLabels([
  { position: '25%', label: '5 km' },
  { position: '50%', label: '10 km' },
  { position: '75%', label: '15 km' }
]);
```

### getShowTimelineLabels()

Signature: `getShowTimelineLabels(): boolean | undefined`

Returns whether generated/custom timeline labels are shown.

```typescript
const showLabels = timeline.getShowTimelineLabels();
```

### setShowTimelineLabels()

Signature: `setShowTimelineLabels(value: boolean): void`

Sets whether generated/custom timeline labels are shown.

```typescript
timeline.setShowTimelineLabels(true);
```

### getAgentLabel()

Signature: `getAgentLabel(): string | undefined`

Returns current label text used for agents.

```typescript
const label = timeline.getAgentLabel();
```

### setAgentLabel()

Signature: `setAgentLabel(label: string): void`

Sets label text used for agents (e.g., "Driver", "Truck", "Courier").

```typescript
timeline.setAgentLabel('Delivery Van');
```

### getAgentColorByIndex()

Signature: `getAgentColorByIndex(index: number): string`

Returns the color for a given agent index using the current color palette.

```typescript
const color = timeline.getAgentColorByIndex(2);
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

Signature: `off(event: string, handler: Function): void`

Unsubscribes a specific handler from timeline events.

**Example:**

```typescript
const handler = (waypoint) => console.log(waypoint);
timeline.on('onWaypointClick', handler);

// Later, unsubscribe
timeline.off('onWaypointClick', handler);
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
  timelineType?: 'time' | 'distance';
  hasLargeDescription?: boolean;
  capacityUnit?: string;
  agentLabel?: string;
  label?: string;
  description?: string;
  showTimelineLabels?: boolean;
  timeLabels?: RoutePlannerTimelineLabel[];
  distanceLabels?: RoutePlannerTimelineLabel[];
  agentColors?: string[];
  showWaypointPopup?: boolean;
  waypointPopupGenerator?: (waypoint: Waypoint) => HTMLElement;
  agentMenuItems?: TimelineMenuItem[];
}
```

| Field | Type | Description |
|---|---|---|
| `timelineType` | `'time' \| 'distance'` | Timeline mode. Default is `time`. |
| `hasLargeDescription` | `boolean` | Enables wider layout for agent info text. |
| `capacityUnit` | `string` | Unit label shown in agent description (for example `kg`, `items`). |
| `agentLabel` | `string` | Prefix label for agents (for example `Driver`, `Truck`). |
| `label` | `string` | Timeline title value accepted by options. |
| `description` | `string` | Timeline subtitle value accepted by options. |
| `showTimelineLabels` | `boolean` | Shows generated/custom axis labels (`timeLabels` / `distanceLabels`). |
| `timeLabels` | `RoutePlannerTimelineLabel[]` | Custom labels/markers for time axis. |
| `distanceLabels` | `RoutePlannerTimelineLabel[]` | Custom labels/markers for distance axis. |
| `agentColors` | `string[]` | Color palette used for agent rows. |
| `showWaypointPopup` | `boolean` | Enables waypoint popup on hover. |
| `waypointPopupGenerator` | `(waypoint: Waypoint) => HTMLElement` | Custom popup content renderer for a waypoint. |
| `agentMenuItems` | `TimelineMenuItem[]` | Three-dot menu items per agent row. |

`label` and `description` are accepted by the options interface, but are currently not rendered by the timeline template.

### TimelineMenuItem

Menu item configuration for agent dropdown menus.

```typescript
interface TimelineMenuItem {
  key: string;
  label?: string;
  disabled?: boolean;
  hidden?: boolean;
  callback: (agentIndex: number) => void;
}
```

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `key` | `string` | Yes | Unique menu item identifier used in event handlers and conditional updates. | `'toggle-visibility'` |
| `label` | `string` | No | Text shown in the menu item. | `'Hide Route'` |
| `disabled` | `boolean` | No | If `true`, the item is visible but not clickable. | `true` |
| `hidden` | `boolean` | No | If `true`, the item is not rendered. | `false` |
| `callback` | `(agentIndex: number) => void` | Yes | Runs when user clicks the item. Receives the clicked agent index. | `(agentIndex) => openAgentDialog(agentIndex)` |

### RoutePlannerTimelineLabel

Label configuration for axis markers.

```typescript
interface RoutePlannerTimelineLabel {
  position: string;
  label: string;
}
```

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `position` | `string` | Yes | Position on axis as a percent string. | `'50%'` |
| `label` | `string` | Yes | Text displayed near the marker line. | `'10 km'` |

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
* [`AgentPlan`](./agent-plan.md) — Agent-level plan data
* [`Waypoint`](./waypoint.md) — Individual waypoint details
