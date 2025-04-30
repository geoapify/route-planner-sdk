import { RoutePlannerTimelineLabel } from "./route-planner-timeline-label";
import { Waypoint } from "../../entities";

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
    storageColor?: string;
    showWaypointPopup?: boolean;
    waypointPopupGenerator?: (waypoint: Waypoint) => HTMLElement;
}
