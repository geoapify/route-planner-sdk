import { Timeline } from "./timeline";

export interface TimelineMenuItem {
  key: string;
  label?: string;
  labelFunction?: (timeline: Timeline) => string;
  callback: (agentIndex: number) => void;
}
