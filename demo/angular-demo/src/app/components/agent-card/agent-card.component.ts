import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentInfo } from '../../models/demo.types';
import { JobItemComponent } from '../job-item/job-item.component';
import { ShipmentItemComponent } from '../shipment-item/shipment-item.component';

@Component({
  selector: 'app-agent-card',
  standalone: true,
  imports: [CommonModule, JobItemComponent, ShipmentItemComponent],
  templateUrl: './agent-card.component.html',
  styleUrls: ['./agent-card.component.css']
})
export class AgentCardComponent {
  @Input() agent!: AgentInfo;
  @Input() allAgents!: AgentInfo[];
  @Input() isLoading = false;

  @Output() moveSelected = new EventEmitter<{ fromAgent: number, toAgent: number }>();
  @Output() removeSelected = new EventEmitter<number>();
  @Output() addJob = new EventEmitter<number>();
  @Output() addShipment = new EventEmitter<number>();

  getDisplayName(): string {
    return `Agent ${this.agent.index + 1}`;
  }

  getAgentColor(): string {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
    return colors[this.agent.index % colors.length];
  }

  getCapabilities(): string[] {
    return this.agent.data.capabilities || [];
  }

  getPickupCapacity(): number | undefined {
    return this.agent.data.pickup_capacity;
  }

  getDeliveryCapacity(): number | undefined {
    return this.agent.data.delivery_capacity;
  }

  getTimeWindows(): [number, number][] {
    return this.agent.data.time_windows || [];
  }

  hasBreaks(): boolean {
    return (this.agent.data.breaks && this.agent.data.breaks.length > 0) || false;
  }

  getDistance(): number {
    return this.agent.solution?.getDistance() || 0;
  }

  getTime(): number {
    return this.agent.solution?.getTime() || 0;
  }

  getSelectedCount(): number {
    const selectedJobs = this.agent.jobs.filter(j => j.selected).length;
    const selectedShipments = this.agent.shipments.filter(s => s.selected).length;
    return selectedJobs + selectedShipments;
  }

  onMoveSelected(targetIndex: string) {
    const toAgent = parseInt(targetIndex);
    if (toAgent >= 0) {
      this.moveSelected.emit({ fromAgent: this.agent.index, toAgent });
    }
  }

  getAgentDisplayName(agent: AgentInfo): string {
    return `Agent ${agent.index + 1}`;
  }

  formatTimeWindow(window: [number, number]): string {
    return `${this.formatTime(window[0])} - ${this.formatTime(window[1])}`;
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - (hours * 3600)) / 60);
    if (seconds === 0) return '0';
    if (!hours) return `${minutes}min`;
    if (!minutes) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  formatDistance(meters: number): string {
    if (meters > 10000) return `${(meters / 1000).toFixed(1)} km`;
    if (meters > 5000) return `${(meters / 1000).toFixed(2)} km`;
    return `${meters} m`;
  }

  getRouteStops(): Array<{ type: string, details?: string }> {
    if (!this.agent.solution) return [];
    
    const stops: Array<{ type: string, details?: string }> = [];
    const actions = this.agent.solution.getActions();
    
    actions.forEach(action => {
      const type = action.getType();
      
      if (type === 'start') {
        stops.push({ type: 'START' });
      } else if (type === 'end') {
        stops.push({ type: 'END' });
      } else if (type === 'job') {
        const jobId = action.getJobId();
        const jobIndex = action.getJobIndex();
        const job = this.agent.jobs.find(j => j.index === jobIndex);
        let details = jobId || `job-${jobIndex}`;
        if (job?.data.pickup_amount) details += ` ↑${job.data.pickup_amount}kg`;
        if (job?.data.delivery_amount) details += ` ↓${job.data.delivery_amount}kg`;
        stops.push({ type: 'JOB', details });
      } else if (type === 'pickup') {
        const shipmentId = action.getShipmentId();
        const shipmentIndex = action.getShipmentIndex();
        const shipment = this.agent.shipments.find(s => s.index === shipmentIndex);
        let details = shipmentId || `shipment-${shipmentIndex}`;
        if (shipment?.data.amount) details += ` ↑${shipment.data.amount}kg`;
        stops.push({ type: 'PICKUP', details });
      } else if (type === 'delivery') {
        const shipmentId = action.getShipmentId();
        const shipmentIndex = action.getShipmentIndex();
        const shipment = this.agent.shipments.find(s => s.index === shipmentIndex);
        let details = shipmentId || `shipment-${shipmentIndex}`;
        if (shipment?.data.amount) details += ` ↓${shipment.data.amount}kg`;
        stops.push({ type: 'DELIVERY', details });
      } else if (type === 'break') {
        stops.push({ type: 'BREAK', details: 'rest period' });
      }
    });
    
    return stops;
  }
}

