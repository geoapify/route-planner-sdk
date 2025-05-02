import { RoutePlannerTimelineLabel } from "./route-planner-timeline-label";
import { Waypoint } from "../../entities";
import { TimelineMenuItem } from "./timeline-menu-item";

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
