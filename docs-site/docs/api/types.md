# Types and Interfaces

This page documents the common types, interfaces, and constants used throughout the `@geoapify/route-planner-sdk` library.

## Route Editor Options

### AddAssignOptions

Options for assigning or adding jobs/shipments to an agent's route.

```typescript
interface AddAssignOptions {
  /**
   * Strategy for adding/assigning items to the route.
   * - 'reoptimize': Full route re-optimization (default)
   * - 'insert': Insert at optimal or specified position
   * - 'append': Add to end of route
   */
  strategy?: 'reoptimize' | 'insert' | 'append';

  /** Insert at a specific index in the agent's route */
  insertAtIndex?: number;

  /** Insert before the stop with this ID */
  beforeId?: string;

  /** Insert after the stop with this ID */
  afterId?: string;

  /** Priority for optimization (higher = more important) */
  priority?: number;

  /** Reserved for future use */
  allowViolations?: boolean;
}
```

### RemoveOptions

Options for removing jobs/shipments from an agent's route.

```typescript
interface RemoveOptions {
  /**
   * Strategy for removing items from the route.
   * - 'reoptimize': Full route re-optimization after removal (default)
   * - 'preserveOrder': Remove without reordering remaining stops
   */
  strategy?: 'reoptimize' | 'preserveOrder';
}
```

### Strategy Constants

Type-safe constants for strategies. Use these instead of string literals for better IDE support and type safety.

```typescript
import { REOPTIMIZE, INSERT, APPEND, PRESERVE_ORDER } from '@geoapify/route-planner-sdk';

// Usage
await editor.assignJobs('agent-A', ['job-1'], { strategy: REOPTIMIZE });
await editor.assignJobs('agent-A', ['job-2'], { strategy: APPEND });
await editor.removeJobs(['job-3'], { strategy: PRESERVE_ORDER });
```

**Constants:**

| Constant | Value | Used For |
|----------|-------|----------|
| `REOPTIMIZE` | `'reoptimize'` | Full optimization (add/assign/remove) |
| `INSERT` | `'insert'` | Optimal position insertion (add/assign) |
| `APPEND` | `'append'` | Add to end of route (add/assign) |
| `PRESERVE_ORDER` | `'preserveOrder'` | Remove without reordering (remove) |

**Types:**

```typescript
export type AddAssignStrategy = 'reoptimize' | 'insert' | 'append';
export type RemoveStrategy = 'reoptimize' | 'preserveOrder';
```

---

## Timeline Options

### TimelineMenuItem

Configuration for dropdown menu items in the timeline agent rows.

```typescript
interface TimelineMenuItem {
  /** Unique identifier for the menu item */
  key: string;
  
  /** Display text for the menu item */
  label?: string;
  
  /** Whether the item is disabled (greyed out) */
  disabled?: boolean;
  
  /** Whether the item is hidden */
  hidden?: boolean;
  
  /** Callback function when the item is clicked */
  callback: (agentIndex: number) => void;
}
```

**Example:**

```typescript
const menuItems: TimelineMenuItem[] = [
  {
    key: 'edit',
    label: 'Edit Agent',
    callback: (agentIndex) => openEditDialog(agentIndex)
  },
  {
    key: 'delete',
    label: 'Remove Agent',
    disabled: true,
    callback: (agentIndex) => removeAgent(agentIndex)
  }
];
```

### RoutePlannerTimelineOptions

Configuration options for the `RoutePlannerTimeline` component.

```typescript
interface RoutePlannerTimelineOptions {
  /** Display mode: 'time' (default) or 'distance' */
  timelineType?: 'time' | 'distance';
  
  /** Enable wider agent info display */
  hasLargeDescription?: boolean;
  
  /** Unit label for capacity (e.g., 'kg', 'items', 'liters') */
  capacityUnit?: string;
  
  /** Label for agents (e.g., 'Driver', 'Truck', 'Courier') */
  agentLabel?: string;
  
  /** Main title for the timeline */
  label?: string;
  
  /** Description text below the title */
  description?: string;
  
  /** Vertical markers for time axis */
  timeLabels?: RoutePlannerTimelineLabel[];
  
  /** Vertical markers for distance axis */
  distanceLabels?: RoutePlannerTimelineLabel[];
  
  /** Color palette for agent rows */
  agentColors?: string[];
  
  /** Show popup on waypoint hover */
  showWaypointPopup?: boolean;
  
  /** Custom popup generator function */
  waypointPopupGenerator?: (waypoint: Waypoint) => HTMLElement;
  
  /** Dropdown menu items for each agent row */
  agentMenuItems?: TimelineMenuItem[];
}
```

### RoutePlannerTimelineLabel

Configuration for axis markers on the timeline.

```typescript
interface RoutePlannerTimelineLabel {
  /** Position as percentage (e.g., '25%', '50%', '75%') */
  position: string;
  
  /** Label text to display */
  label: string;
}
```

**Example:**

```typescript
const timeLabels: RoutePlannerTimelineLabel[] = [
  { position: '25%', label: '1h' },
  { position: '50%', label: '2h' },
  { position: '75%', label: '3h' }
];
```

---

## Routing Options

### RoutingOptions

Configuration for route calculation parameters.

```typescript
interface RoutingOptions {
  /** Travel mode */
  mode: TravelMode;
  
  /** Route optimization type */
  type?: RouteType;
  
  /** Distance unit system */
  units?: DistanceUnitType;
  
  /** Language for turn-by-turn instructions */
  lang?: string;
  
  /** Road types to avoid */
  avoid?: AvoidType[];
  
  /** Additional details to include in response */
  details?: RouteDetailsType[];
  
  /** Traffic model */
  traffic?: TrafficType;
  
  /** Maximum speed limit (km/h) */
  max_speed?: number;
}
```

---

## Travel and Route Types

### TravelMode

The mode of transportation for route calculation.

```typescript
type TravelMode = 'drive' | 'truck' | 'scooter' | 'bicycle' | 'walk' | 'transit';
```

| Value | Description |
|-------|-------------|
| `drive` | Standard car routing |
| `truck` | Heavy vehicle with road restrictions |
| `scooter` | Motorized scooter |
| `bicycle` | Bicycle routing |
| `walk` | Pedestrian routing |
| `transit` | Public transportation |

### RouteType

The optimization preference for route calculation.

```typescript
type RouteType = 'balanced' | 'short' | 'less_maneuvers';
```

| Value | Description |
|-------|-------------|
| `balanced` | Balance between time and distance (default) |
| `short` | Shortest distance |
| `less_maneuvers` | Fewer turns and lane changes |

### TrafficType

The traffic model used for travel time estimation.

```typescript
type TrafficType = 'free_flow' | 'approximated';
```

| Value | Description |
|-------|-------------|
| `free_flow` | Ideal traffic conditions |
| `approximated` | Typical traffic patterns |

### DistanceUnitType

The unit system for distances.

```typescript
type DistanceUnitType = 'metric' | 'imperial';
```

| Value | Description |
|-------|-------------|
| `metric` | Kilometers and meters |
| `imperial` | Miles and feet |

### AvoidType

Road types that can be avoided in routing.

```typescript
type AvoidType = 'tolls' | 'highways' | 'ferries';
```

### RouteDetailsType

Additional details that can be included in the route response.

```typescript
type RouteDetailsType = 'instruction_details' | 'route_details';
```

---

## Learn More

* [`RoutePlannerResultEditor`](./route-planner-result-editor.md) — Uses AddAssignOptions and RemoveOptions
* [`RoutePlannerTimeline`](./route-planner-timeline.md) — Uses TimelineMenuItem and RoutePlannerTimelineOptions
* [`RoutePlanner`](./route-planner.md) — Uses RoutingOptions and travel types
