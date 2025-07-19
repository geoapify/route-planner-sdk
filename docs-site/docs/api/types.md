# Interfaces

## TimelineMenuItem

```ts
export interface TimelineMenuItem {
  key: string;
  label?: string;
  labelFunction?: (timeline: Timeline) => string;
  callback: (agentIndex: number) => void;
}
```


## RoutePlannerTimelineOptions
```
export interface RoutePlannerTimelineOptions {
    timelineType?: 'time' | 'distance';
    hasLargeDescription?: boolean;
    capacityUnit?: string;
    agentLabel?: string;
    label?: string;
    description?: string;
    timeLabels?: RoutePlannerTimelineLabel[];
    distanceLabels?: RoutePlannerTimelineLabel[];
    agentColors?: string[];
    showWaypointPopup?: boolean;
    waypointPopupGenerator?: (waypoint: Waypoint) => HTMLElement;
    agentMenuItems?: TimelineMenuItem[];
}
```

## RoutingOptions
```ts
export interface RoutingOptions {
    mode: TravelMode;
    type?: RouteType;
    units?: DistanceUnitType;
    lang?: string;
    avoid?: AvoidType[];
    details?: RouteDetailsType[];
    traffic?: TrafficType;
    max_speed?: number;
}
```
