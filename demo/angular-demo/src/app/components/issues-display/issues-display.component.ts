import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoutePlannerResult } from '../../../../../../src';

@Component({
  selector: 'app-issues-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issues-display.component.html',
  styleUrls: ['./issues-display.component.css']
})
export class IssuesDisplayComponent {
  @Input() result: RoutePlannerResult | undefined;

  hasIssues(): boolean {
    if (!this.result) return false;
    
    const rawData = this.result.getRawData();
    const issues = rawData.properties.issues;
    
    return !!(issues && (
      issues.unassigned_agents?.length ||
      issues.unassigned_jobs?.length ||
      issues.unassigned_shipments?.length
    ));
  }

  getTotalIssues(): number {
    if (!this.result) return 0;
    
    const issues = this.result.getRawData().properties.issues;
    if (!issues) return 0;
    
    return (issues.unassigned_agents?.length || 0) +
           (issues.unassigned_jobs?.length || 0) +
           (issues.unassigned_shipments?.length || 0);
  }

  getUnassignedJobs(): Array<{ index: number, id: string }> {
    if (!this.result) return [];
    
    const rawData = this.result.getRawData();
    const jobIndexes = rawData.properties.issues?.unassigned_jobs || [];
    const allJobs = rawData.properties.params.jobs;
    
    return jobIndexes.map(index => ({
      index,
      id: allJobs[index]?.id || `job-${index}`
    }));
  }

  getUnassignedShipments(): Array<{ index: number, id: string }> {
    if (!this.result) return [];
    
    const rawData = this.result.getRawData();
    const shipmentIndexes = rawData.properties.issues?.unassigned_shipments || [];
    const allShipments = rawData.properties.params.shipments;
    
    return shipmentIndexes.map(index => ({
      index,
      id: allShipments[index]?.id || `shipment-${index}`
    }));
  }

  getUnassignedAgents(): number[] {
    if (!this.result) return [];
    return this.result.getRawData().properties.issues?.unassigned_agents || [];
  }
}

