import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAssignStrategy, REOPTIMIZE, PRESERVE_ORDER } from '../../../../../../src';

export interface AddShipmentData {
  id: string;
  pickupLon: number;
  pickupLat: number;
  deliveryLon: number;
  deliveryLat: number;
  agentIndex: number;
}

export interface ShipmentModalOptions {
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
  selector: 'app-add-shipment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-shipment-modal.component.html',
  styleUrls: ['./add-shipment-modal.component.css']
})
export class AddShipmentModalComponent implements OnInit {
  @Input() agentName = '';
  @Input() isLoading = false;
  @Input() agentIndex = 0;
  @Input() allAgents: any[] = [];
  @Input() set initialCoordinates(coords: { lon: number; lat: number } | null) {
    if (coords) {
      // Use clicked location as delivery location
      this.deliveryLon = coords.lon;
      this.deliveryLat = coords.lat;
    }
  }

  @Output() add = new EventEmitter<{ shipmentData: AddShipmentData; options: ShipmentModalOptions }>();
  @Output() cancel = new EventEmitter<void>();
  
  selectedAgentIndex = 0;

  // Shipment data
  shipmentId = `new_order_${Date.now()}`;
  pickupLon = -77.0369;  // Washington, DC - warehouse
  pickupLat = 38.9072;   // Washington, DC
  deliveryLon = -77.0319;
  deliveryLat = 38.9101;

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
    const shipmentData: AddShipmentData = {
      id: this.shipmentId,
      pickupLon: this.pickupLon,
      pickupLat: this.pickupLat,
      deliveryLon: this.deliveryLon,
      deliveryLat: this.deliveryLat,
      agentIndex: this.selectedAgentIndex
    };

    const options: ShipmentModalOptions = {
      strategy: this.strategy,
      beforeWaypointIndex: this.beforeWaypointIndex,
      afterWaypointIndex: this.afterWaypointIndex,
      beforeId: this.beforeId,
      afterId: this.afterId,
      priority: this.priority,
      allowViolations: this.allowViolations,
      appendToEnd: this.appendToEnd
    };

    this.add.emit({ shipmentData, options });
    
    // Generate new ID for next shipment
    this.shipmentId = `new_order_${Date.now()}`;
  }

  onCancel() {
    this.cancel.emit();
  }
}


