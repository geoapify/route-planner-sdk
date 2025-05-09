export interface TimelineItem {
  position: string;
  actualWidth: string;
  minWidth: string;
  form: 'full' | 'standard' | 'minimal';
  type: 'start' | 'job' | 'end';
  description: string;
}
