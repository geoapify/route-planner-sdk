import { JobData, ShipmentData } from "../../../../models";
import { StrategyContext } from "./strategy-context";

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

    static markExistingUnassignedJobs(context: StrategyContext, jobs: JobData[]): void {
        const unassignedJobs = context.getRawData().properties.issues?.unassigned_jobs;
        if (unassignedJobs) {
            this.markItemsAsUnassigned(jobs, unassignedJobs);
        }
    }

    static markExistingUnassignedShipments(context: StrategyContext, shipments: ShipmentData[]): void {
        const unassignedShipments = context.getRawData().properties.issues?.unassigned_shipments;
        if (unassignedShipments) {
            this.markItemsAsUnassigned(shipments, unassignedShipments);
        }
    }

    static markRemainingJobsWithAgentRequirement(context: StrategyContext, jobs: JobData[], excludeIndexes: number[]): void {
        for (let i = 0; i < jobs.length; i++) {
            if (excludeIndexes.includes(i)) continue;
            
            const jobInfo = context.getResult().getJobInfoByIndex(i);
            if (!jobInfo) continue;
            
            const agentIndex = jobInfo.getAgent().getAgentIndex();
            this.assignToAgent(jobs[i], agentIndex);
        }
    }

    static markRemainingShipmentsWithAgentRequirement(context: StrategyContext, shipments: ShipmentData[], excludeIndexes: number[]): void {
        for (let i = 0; i < shipments.length; i++) {
            if (excludeIndexes.includes(i)) continue;
            
            const shipmentInfo = context.getResult().getShipmentInfoByIndex(i);
            if (!shipmentInfo) continue;
            
            const agentIndex = shipmentInfo.getAgent().getAgentIndex();
            this.assignToAgent(shipments[i], agentIndex);
        }
    }
}
