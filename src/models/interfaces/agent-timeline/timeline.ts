import { TravelMode } from "../../types";
import { SolutionItem } from "./solution-item";

export interface TimelineData {
    agentIcon: string;
    hasLargeDescription: boolean;
    timelines: TimelineItem[];
}

export interface TimelineItem {
    label: string,
    mode?: TravelMode,
    color: string,
    description: string,
    routeVisible: boolean,
    agentIndex: number

    timelineLength: string;
    distanceLineLength: string;
    timelineLeft: string;

    itemsByTime: SolutionItem[];
    itemsByDistance: SolutionItem[];
}
