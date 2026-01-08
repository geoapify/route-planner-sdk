import { AgentSolution, AgentData, JobData, ShipmentData } from '../../../../../src';

/**
 * UI-specific wrapper for JobData with selection state
 */
export interface JobInfo {
  index: number;
  data: JobData;
  selected: boolean;
}

/**
 * UI-specific wrapper for ShipmentData with selection state
 */
export interface ShipmentInfo {
  index: number;
  data: ShipmentData;
  selected: boolean;
}

/**
 * UI-specific agent information combining SDK data with current assignments
 */
export interface AgentInfo {
  index: number;
  data: AgentData;
  solution: AgentSolution | null;
  jobs: JobInfo[];
  shipments: ShipmentInfo[];
}

export interface EditorLog {
  timestamp: Date;
  operation: string;
  success: boolean;
  message: string;
}

