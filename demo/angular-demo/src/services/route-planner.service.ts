import { Injectable } from '@angular/core';
import RoutePlanner, { 
  Agent,
  Job,
  Shipment,
  ShipmentStep,
  RoutePlannerInputData, 
  RoutePlannerResult,
  RoutePlannerResultEditor,
  AddAssignOptions,
  RemoveOptions
} from '../../../../src';
import { ScenarioHelper } from './scenario-helper';
import TEST_API_KEY from "../../../../env-variables";

export interface EditorOperationResult {
  success: boolean;
  message: string;
  result?: RoutePlannerResult;
}

@Injectable({
  providedIn: 'root'
})
export class RoutePlannerService {
  API_KEY = TEST_API_KEY;

  async createValidationTestScenario(): Promise<RoutePlannerResult | string> {
    return ScenarioHelper.createValidationScenario(this.API_KEY);
  }

  async createLargeTestScenario(): Promise<RoutePlannerResult | string> {
    return ScenarioHelper.createLargeScenario(this.API_KEY);
  }

  /**
   * Assign jobs to a different agent using the editor
   */
  async assignJobs(
    result: RoutePlannerResult, 
    agentIndex: number, 
    jobIndexes: number[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.assignJobs(agentIndex, jobIndexes, options);
      return {
        success,
        message: success 
          ? `${jobIndexes.length} job(s) assigned to agent index ${agentIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Assignment failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('[assignJobs] Operation failed');
      console.error('[assignJobs] Error:', error);
      console.error('[assignJobs] Stack:', error.stack);
      console.error('[assignJobs] Agent index:', agentIndex);
      console.error('[assignJobs] Job indexes:', jobIndexes);
      console.error('[assignJobs] Options:', options);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Assign shipments to a different agent using the editor
   */
  async assignShipments(
    result: RoutePlannerResult, 
    agentIndex: number, 
    shipmentIndexes: number[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.assignShipments(agentIndex, shipmentIndexes, options);
      return {
        success,
        message: success 
          ? `${shipmentIndexes.length} shipment(s) assigned to agent index ${agentIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Assignment failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('assignShipments failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Remove jobs from the plan
   */
  async removeJobs(
    result: RoutePlannerResult, 
    jobIndexes: number[], 
    options: RemoveOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.removeJobs(jobIndexes, options);
      return {
        success,
        message: success 
          ? `${jobIndexes.length} job(s) removed with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Removal failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('[removeJobs] Operation failed');
      console.error('[removeJobs] Error:', error);
      console.error('[removeJobs] Stack:', error.stack);
      console.error('[removeJobs] Job indexes:', jobIndexes);
      console.error('[removeJobs] Options:', options);
      console.error('[removeJobs] Result data:', result.getRaw());
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Remove shipments from the plan
   */
  async removeShipments(
    result: RoutePlannerResult, 
    shipmentIndexes: number[], 
    options: RemoveOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.removeShipments(shipmentIndexes, options);
      return {
        success,
        message: success 
          ? `${shipmentIndexes.length} shipment(s) removed with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Removal failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('[removeShipments] Operation failed');
      console.error('[removeShipments] Error:', error);
      console.error('[removeShipments] Stack:', error.stack);
      console.error('[removeShipments] Shipment indexes:', shipmentIndexes);
      console.error('[removeShipments] Options:', options);
      console.error('[removeShipments] Result data:', result.getRaw());
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Add new jobs to an agent's plan
   */
  async addNewJobs(
    result: RoutePlannerResult, 
    agentIndex: number, 
    jobs: Job[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.addNewJobs(agentIndex, jobs, options);
      return {
        success,
        message: success 
          ? `${jobs.length} new job(s) added to agent index ${agentIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Adding jobs failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('addNewJobs failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Add new shipments to an agent's plan
   */
  async addNewShipments(
    result: RoutePlannerResult, 
    agentIndex: number, 
    shipments: Shipment[], 
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.addNewShipments(agentIndex, shipments, options);
      return {
        success,
        message: success 
          ? `${shipments.length} new shipment(s) added to agent index ${agentIndex} with strategy: ${options.strategy || 'reoptimize'}` 
          : 'Adding shipments failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('addNewShipments failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Add a new job with validation support
   */
  async addNewJob(
    result: RoutePlannerResult,
    agentIndex: number,
    jobData: {
      id: string;
      lon: number;
      lat: number;
      pickupAmount?: number;
      deliveryAmount?: number;
      requirements?: string[];
      timeWindowStart?: number | null;
      timeWindowEnd?: number | null;
    },
    options: AddAssignOptions = {}
  ): Promise<EditorOperationResult> {
    try {
      const job = new Job()
        .setId(jobData.id)
        .setLocation(jobData.lon, jobData.lat)
        .setDuration(300);

      if (jobData.pickupAmount) job.setPickupAmount(jobData.pickupAmount);
      if (jobData.deliveryAmount) job.setDeliveryAmount(jobData.deliveryAmount);
      if (jobData.requirements) {
        jobData.requirements.forEach(req => job.addRequirement(req));
      }
      if (jobData.timeWindowStart !== null && jobData.timeWindowStart !== undefined && 
          jobData.timeWindowEnd !== null && jobData.timeWindowEnd !== undefined) {
        job.addTimeWindow(jobData.timeWindowStart, jobData.timeWindowEnd);
      }

      const editor = new RoutePlannerResultEditor(result);
      const success = await editor.addNewJobs(agentIndex, [job], options);
      
      return {
        success,
        message: success 
          ? `Job ${jobData.id} added to agent index ${agentIndex}` 
          : 'Adding job failed',
        result: editor.getModifiedResult()
      };
    } catch (error: any) {
      console.error('addNewJob failed:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Create a sample Shipment for testing
   */
  createSampleShipment(
    id: string, 
    pickupLon: number, 
    pickupLat: number, 
    deliveryLon: number, 
    deliveryLat: number,
    pickupDuration: number = 120,
    deliveryDuration: number = 120
  ): Shipment {
    return new Shipment()
      .setId(id)
      .setPickup(
        new ShipmentStep()
          .setLocation(pickupLon, pickupLat)
          .setDuration(pickupDuration)
      )
      .setDelivery(
        new ShipmentStep()
          .setLocation(deliveryLon, deliveryLat)
          .setDuration(deliveryDuration)
      );
  }
}
