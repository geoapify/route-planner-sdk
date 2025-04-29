import { TravelMode } from "../../types";
import { TimelineItem } from "./timeline-item";

export interface Timeline {
    label: string,
    mode?: TravelMode,
    color: string,
    description: string,
    routeVisible: boolean,
    agentIndex: number

    timelineLength: string;
    distanceLineLength: string;
    timelineLeft: string;

    itemsByTime: TimelineItem[];
    itemsByDistance: TimelineItem[];
}
