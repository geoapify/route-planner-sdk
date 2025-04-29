import { RoutePlannerTimelineLabel } from "./route-planner-timeline-label";

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
}
