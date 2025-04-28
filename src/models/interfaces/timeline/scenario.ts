export interface Scenario {
    mode: 'drive' | 'truck' | 'bicycle' | 'walk';
    agentIcon?: string;
    label: string;
    description: string;
    agentLabel: string;
    capacityUnit?: string;
}
export interface SolutionLabel {
  position: string;
  label: string;
}
