import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAssignStrategy, REOPTIMIZE, PRESERVE_ORDER } from '../../../../../../src';

export interface AddJobData {
  id: string;
  lon: number;
  lat: number;
  pickupAmount: number;
  deliveryAmount: number;
  requirements: string;
  timeWindowStart: number | null;
  timeWindowEnd: number | null;
  agentIndex: number;
}

export interface JobModalOptions {
  strategy: AddAssignStrategy;
  beforeWaypointIndex: number | null;
  afterWaypointIndex: number | null;
  beforeId: string;
  afterId: string;
  priority: number | null;
  allowViolations: boolean;
  appendToEnd: boolean;
}

@Component({
  selector: 'app-add-job-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-job-modal.component.html',
  styleUrls: ['./add-job-modal.component.css']
})
export class AddJobModalComponent implements OnInit {
  @Input() agentName = '';
  @Input() isLoading = false;
  @Input() agentIndex = 0;
  @Input() allAgents: any[] = [];
  @Input() set initialCoordinates(coords: { lon: number; lat: number } | null) {
    if (coords) {
      this.lon = coords.lon;
      this.lat = coords.lat;
    }
  }

  @Output() add = new EventEmitter<{ jobData: AddJobData; options: JobModalOptions }>();
  @Output() cancel = new EventEmitter<void>();
  
  selectedAgentIndex = 0;

  // Job data
  jobId = `new_job_${Date.now()}`;
  lon = -77.0319;  // Washington, DC
  lat = 38.9101;   // Washington, DC
  pickupAmount = 0;
  deliveryAmount = 0;
  requirements = '';
  timeWindowStart: number | null = null;
  timeWindowEnd: number | null = null;

  // Options
  strategy: AddAssignStrategy = REOPTIMIZE;
  beforeWaypointIndex: number | null = null;
  afterWaypointIndex: number | null = null;
  beforeId = '';
  afterId = '';
  priority: number | null = null;
  allowViolations = true;
  appendToEnd = false;
  
  // Expose constants for template
  readonly REOPTIMIZE = REOPTIMIZE;
  readonly PRESERVE_ORDER = PRESERVE_ORDER;

  ngOnInit() {
    this.selectedAgentIndex = this.agentIndex;
  }

  onAdd() {
    const jobData: AddJobData = {
      id: this.jobId,
      lon: this.lon,
      lat: this.lat,
      pickupAmount: this.pickupAmount,
      deliveryAmount: this.deliveryAmount,
      requirements: this.requirements,
      timeWindowStart: this.timeWindowStart,
      timeWindowEnd: this.timeWindowEnd,
      agentIndex: this.selectedAgentIndex
    };

    const options: JobModalOptions = {
      strategy: this.strategy,
      beforeWaypointIndex: this.beforeWaypointIndex,
      afterWaypointIndex: this.afterWaypointIndex,
      beforeId: this.beforeId,
      afterId: this.afterId,
      priority: this.priority,
      allowViolations: this.allowViolations,
      appendToEnd: this.appendToEnd
    };

    this.add.emit({ jobData, options });
    
    // Generate new ID for next job
    this.jobId = `new_job_${Date.now()}`;
  }

  onCancel() {
    this.cancel.emit();
  }
}