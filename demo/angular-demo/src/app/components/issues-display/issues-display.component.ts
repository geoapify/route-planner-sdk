import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutePlannerResult } from '../../../../../../src';

@Component({
  selector: 'app-issues-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issues-display.component.html',
  styleUrls: ['./issues-display.component.css']
})
export class IssuesDisplayComponent implements OnChanges {
  @Input() result: RoutePlannerResult | undefined;
  @Output() assignJob = new EventEmitter<number>();
  @Output() assignShipment = new EventEmitter<number>();

  // Cached properties
  hasIssuesCache = false;
  totalIssuesCache = 0;
  unassignedJobsCache: Array<{ index: number, id: string }> = [];
  unassignedShipmentsCache: Array<{ index: number, id: string }> = [];
  unassignedAgentsCache: Array<{ index: number, id: string }> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['result']) {
      this.updateCache();
    }
  }

  private updateCache(): void {
    this.hasIssuesCache = this.calculateHasIssues();
    this.totalIssuesCache = this.calculateTotalIssues();
    this.unassignedJobsCache = this.calculateUnassignedJobs();
    this.unassignedShipmentsCache = this.calculateUnassignedShipments();
    this.unassignedAgentsCache = this.calculateUnassignedAgents();
  }

  onJobClick(index: number) {
    console.log('Job clicked, index:', index);
    this.assignJob.emit(index);
  }

  onShipmentClick(index: number) {
    console.log('Shipment clicked, index:', index);
    this.assignShipment.emit(index);
  }

  // Private calculation methods
  private calculateHasIssues(): boolean {
    if (!this.result) return false;
    
    const rawData = this.result.getRawData();
    const issues = rawData.properties.issues;
    
    return !!(issues && (
      issues.unassigned_agents?.length ||
      issues.unassigned_jobs?.length ||
      issues.unassigned_shipments?.length
    ));
  }

  private calculateTotalIssues(): number {
    if (!this.result) return 0;
    
    const issues = this.result.getRawData().properties.issues;
    if (!issues) return 0;
    
    return (issues.unassigned_agents?.length || 0) +
           (issues.unassigned_jobs?.length || 0) +
           (issues.unassigned_shipments?.length || 0);
  }

  private calculateUnassignedJobs(): Array<{ index: number, id: string }> {
    if (!this.result) return [];
    
    const rawData = this.result.getRawData();
    const jobIndexes = rawData.properties.issues?.unassigned_jobs || [];
    const allJobs = rawData.properties.params.jobs;
    
    return jobIndexes.map(index => ({
      index,
      id: allJobs[index]?.id || `job-${index}`
    }));
  }

  private calculateUnassignedShipments(): Array<{ index: number, id: string }> {
    if (!this.result) return [];
    
    const rawData = this.result.getRawData();
    const shipmentIndexes = rawData.properties.issues?.unassigned_shipments || [];
    const allShipments = rawData.properties.params.shipments;
    
    return shipmentIndexes.map(index => ({
      index,
      id: allShipments[index]?.id || `shipment-${index}`
    }));
  }

  private calculateUnassignedAgents(): Array<{ index: number, id: string }> {
    if (!this.result) return [];
    
    const rawData = this.result.getRawData();
    const agentIndexes = rawData.properties.issues?.unassigned_agents || [];
    const allAgents = rawData.properties.params.agents;
    
    return agentIndexes.map(index => ({
      index,
      id: allAgents[index]?.id || `agent-${index}`
    }));
  }
}

