export interface TimelineItem {
  position: string;
  actualWidth: string;
  minWidth: string;
  form: 'full' | 'standard' | 'minimal';
  // ToDo: add breaks support to the "preserveOrder" strategy
  type: 'start' | 'job' | 'end' | 'break';
  description: string;
}
