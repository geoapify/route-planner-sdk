import { JobData, ShipmentData } from "../../../../models";
import {RouteResultEditorBase} from "../../route-result-editor-base";

type ItemWithRequirements = { requirements?: string[] };

/**
 * Shared helper for managing requirements on jobs and shipments
 */
export class RequirementHelper {
    static readonly UNASSIGNED_REQ = "unassigned";
    static readonly ASSIGN_AGENT_PREFIX = "assign-agent-";

    static createAssignAgentRequirement(agentIndex: number): string {
        return `${this.ASSIGN_AGENT_PREFIX}${agentIndex}`;
    }

    static ensureRequirementsArray(item: ItemWithRequirements): void {
        if (!item.requirements) {
            item.requirements = [];
        }
    }

    static addRequirement(requirements: string[], req: string): void {
        if (!requirements.includes(req)) {
            requirements.push(req);
        }
    }

    static removeRequirement(requirements: string[], req: string): void {
        const index = requirements.indexOf(req);
        if (index !== -1) {
            requirements.splice(index, 1);
        }
    }

    static markAsUnassigned(item: ItemWithRequirements): void {
        this.ensureRequirementsArray(item);
        this.addRequirement(item.requirements!, this.UNASSIGNED_REQ);
    }

    static assignToAgent(item: ItemWithRequirements, agentIndex: number): void {
        const assignAgentReq = this.createAssignAgentRequirement(agentIndex);
        this.ensureRequirementsArray(item);
        this.removeRequirement(item.requirements!, this.UNASSIGNED_REQ);
        this.addRequirement(item.requirements!, assignAgentReq);
    }

    // ===== Batch operations =====

    static markItemsAsUnassigned<T extends ItemWithRequirements>(items: T[], indexes: number[]): void {
        for (const index of indexes) {
            if (items[index]) {
                this.markAsUnassigned(items[index]);
            }
        }
    }

    static assignItemsToAgent<T extends ItemWithRequirements>(items: T[], indexes: number[], agentIndex: number): void {
        for (const index of indexes) {
            if (items[index]) {
                this.assignToAgent(items[index], agentIndex);
            }
        }
    }

    static markExistingUnassignedJobs(context: RouteResultEditorBase, jobs: JobData[]): void {
        const unassignedJobs = context.getRawData().properties.issues?.unassigned_jobs;
        if (unassignedJobs) {
            this.markItemsAsUnassigned(jobs, unassignedJobs);
        }
    }

    static markExistingUnassignedShipments(context: RouteResultEditorBase, shipments: ShipmentData[]): void {
        const unassignedShipments = context.getRawData().properties.issues?.unassigned_shipments;
        if (unassignedShipments) {
            this.markItemsAsUnassigned(shipments, unassignedShipments);
        }
    }

    static markRemainingJobsWithAgentRequirement(context: RouteResultEditorBase, jobs: JobData[], excludeIndexes: number[]): void {
        for (let i = 0; i < jobs.length; i++) {
            if (excludeIndexes.includes(i)) continue;
            
            const agentIndexForJob = context.getAgentIndexForJob(i);
            if (agentIndexForJob === undefined) continue;
            
            this.assignToAgent(jobs[i], agentIndexForJob!);
        }
    }

    static markRemainingShipmentsWithAgentRequirement(context: RouteResultEditorBase, shipments: ShipmentData[], excludeIndexes: number[]): void {
        for (let i = 0; i < shipments.length; i++) {
            if (excludeIndexes.includes(i)) continue;
            
            const agentIndexForShipment = context.getAgentIndexForShipment(i);
            if (agentIndexForShipment === undefined) continue;
            
            this.assignToAgent(shipments[i], agentIndexForShipment!);
        }
    }
}
