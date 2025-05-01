export interface TimelineMenuItem {
  key: string;
  label: string;
  callback: (agentIndex: number) => void;
}
