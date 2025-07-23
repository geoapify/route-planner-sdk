export interface TimelineMenuItem {
  key: string;
  label?: string;
  disabled?: boolean;
  hidden?: boolean;
  callback: (agentIndex: number) => void;
}
