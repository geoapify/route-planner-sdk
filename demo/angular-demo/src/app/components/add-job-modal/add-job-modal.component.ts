import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAssignStrategy } from '../../../../../../src';

export interface AddJobData {
  id: string;
  lon: number;
  lat: number;
  pickupAmount: number;
  deliveryAmount: number;
  requirements: string;
  timeWindowStart: number | null;
  timeWindowEnd: number | null;
}

export interface JobModalOptions {
  strategy: AddAssignStrategy;
  insertAtIndex: number | null;
  insertAfterId: string;
  insertBeforeId: string;
  priority: number | null;
  allowViolations: boolean;
}

@Component({
  selector: 'app-add-job-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-job-modal.component.html',
  styleUrls: ['./add-job-modal.component.css']
})
export class AddJobModalComponent {
  @Input() agentName = '';
  @Input() isLoading = false;
  @Input() set initialCoordinates(coords: { lon: number; lat: number } | null) {
    if (coords) {
      this.lon = coords.lon;
      this.lat = coords.lat;
    }
  }

  @Output() add = new EventEmitter<{ jobData: AddJobData; options: JobModalOptions }>();
  @Output() cancel = new EventEmitter<void>();

  // Job data
  jobId = `new_job_${Date.now()}`;
  lon = -77.0319;  // Washington, DC
  lat = 38.9101;   // Washington, DC
  pickupAmount = 0;
  deliveryAmount = 100;
  requirements = '';
  timeWindowStart: number | null = null;
  timeWindowEnd: number | null = null;

  // Options
  strategy: AddAssignStrategy = 'reoptimize';
  insertAtIndex: number | null = null;
  insertAfterId = '';
  insertBeforeId = '';
  priority: number | null = null;
  allowViolations = true;

  onAdd() {
    const jobData: AddJobData = {
      id: this.jobId,
      lon: this.lon,
      lat: this.lat,
      pickupAmount: this.pickupAmount,
      deliveryAmount: this.deliveryAmount,
      requirements: this.requirements,
      timeWindowStart: this.timeWindowStart,
      timeWindowEnd: this.timeWindowEnd
    };

    const options: JobModalOptions = {
      strategy: this.strategy,
      insertAtIndex: this.insertAtIndex,
      insertAfterId: this.insertAfterId,
      insertBeforeId: this.insertBeforeId,
      priority: this.priority,
      allowViolations: this.allowViolations
    };

    this.add.emit({ jobData, options });
    
    // Generate new ID for next job
    this.jobId = `new_job_${Date.now()}`;
  }

  onCancel() {
    this.cancel.emit();
  }
}

