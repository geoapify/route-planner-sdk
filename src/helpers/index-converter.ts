import { RoutePlannerResultData } from "../models/interfaces/result/route-planner-result-data";

/**
 * Helper class for converting IDs to indexes and vice versa
 */
export class IndexConverter {
    /**
     * Converts agent ID or index to index
     */
    static convertAgentToIndex(data: RoutePlannerResultData, agentIdOrIndex: string | number, throwExceptionIfNotFound = false): number {
        if(typeof agentIdOrIndex === "number") {
            return agentIdOrIndex as number;
        }
        let index = data.inputData.agents.findIndex(agent => agent.id === agentIdOrIndex);
        if(index === -1) {
            if(throwExceptionIfNotFound) {
                throw new Error(`Agent with id ${agentIdOrIndex} not found`);
            }
            return -1;
        } else {
            return index;
        }
    }

    /**
     * Converts job ID or index to index
     */
    static convertJobToIndex(data: RoutePlannerResultData, jobIdOrIndex: string | number): number {
        if(typeof jobIdOrIndex === "number") {
            return jobIdOrIndex as number;
        }
        let jobIndex = data.inputData.jobs.findIndex(job => job.id === jobIdOrIndex);
        if (jobIndex < 0) {
            return -1;
        } else {
            return jobIndex;
        }
    }

    /**
     * Converts shipment ID or index to index
     */
    static convertShipmentToIndex(data: RoutePlannerResultData, shipmentIdOrIndex: string | number): number {
        if (typeof shipmentIdOrIndex === "number") {
            return shipmentIdOrIndex as number;
        }
        let shipmentIndex = data.inputData.shipments.findIndex(shipment => shipment.id === shipmentIdOrIndex);
        if (shipmentIndex < 0) {
            return -1;
        } else {
            return shipmentIndex;
        }
    }

    /**
     * Converts multiple job IDs or indexes to indexes
     */
    static convertJobsToIndexes(data: RoutePlannerResultData, jobIndexesOrIds: number[] | string[]): number[] {
        if(typeof jobIndexesOrIds[0] === "number") {
            return jobIndexesOrIds as number[];
        }
        let jobIndexes: number[] = [];
        jobIndexesOrIds.forEach(jobId => {
            let jobIndex = data.inputData.jobs.findIndex(job => job.id === jobId);
            if (jobIndex < 0) {
                throw new Error(`Job with id ${jobId} not found`);
            } else {
                jobIndexes.push(jobIndex);
            }
        })
        return jobIndexes;
    }

    /**
     * Converts multiple shipment IDs or indexes to indexes
     */
    static convertShipmentsToIndexes(data: RoutePlannerResultData, shipmentIds: number[] | string[]): number[] {
        if (typeof shipmentIds[0] === "number") {
            return shipmentIds as number[];
        }
        let shipmentIndexes: number[] = [];
        shipmentIds.forEach(shipmentId => {
            let shipmentIndex = data.inputData.shipments.findIndex(shipment => shipment.id === shipmentId);
            if (shipmentIndex < 0) {
                throw new Error(`Shipment with id ${shipmentId} not found`);
            } else {
                shipmentIndexes.push(shipmentIndex);
            }
        })
        return shipmentIndexes;
    }
} 