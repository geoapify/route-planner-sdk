import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAssignStrategy } from '../../../../../../src';

export interface AddShipmentData {
  id: string;
  pickupLon: number;
  pickupLat: number;
  deliveryLon: number;
  deliveryLat: number;
}

export interface ShipmentModalOptions {
  strategy: AddAssignStrategy;
  insertAtIndex: number | null;
  insertAfterId: string;
  insertBeforeId: string;
  priority: number | null;
  allowViolations: boolean;
}

@Component({
  selector: 'app-add-shipment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-shipment-modal.component.html',
  styleUrls: ['./add-shipment-modal.component.css']
})
export class AddShipmentModalComponent {
  @Input() agentName = '';
  @Input() isLoading = false;
  @Input() set initialCoordinates(coords: { lon: number; lat: number } | null) {
    if (coords) {
      // Use clicked location as delivery location
      this.deliveryLon = coords.lon;
      this.deliveryLat = coords.lat;
    }
  }

  @Output() add = new EventEmitter<{ shipmentData: AddShipmentData; options: ShipmentModalOptions }>();
  @Output() cancel = new EventEmitter<void>();

  // Shipment data
  shipmentId = `new_order_${Date.now()}`;
  pickupLon = -77.0369;  // Washington, DC - warehouse
  pickupLat = 38.9072;   // Washington, DC
  deliveryLon = -77.0319;
  deliveryLat = 38.9101;

  // Options
  strategy: AddAssignStrategy = 'reoptimize';
  insertAtIndex: number | null = null;
  insertAfterId = '';
  insertBeforeId = '';
  priority: number | null = null;
  allowViolations = true;

  onAdd() {
    const shipmentData: AddShipmentData = {
      id: this.shipmentId,
      pickupLon: this.pickupLon,
      pickupLat: this.pickupLat,
      deliveryLon: this.deliveryLon,
      deliveryLat: this.deliveryLat
    };

    const options: ShipmentModalOptions = {
      strategy: this.strategy,
      insertAtIndex: this.insertAtIndex,
      insertAfterId: this.insertAfterId,
      insertBeforeId: this.insertBeforeId,
      priority: this.priority,
      allowViolations: this.allowViolations
    };

    this.add.emit({ shipmentData, options });
    
    // Generate new ID for next shipment
    this.shipmentId = `new_order_${Date.now()}`;
  }

  onCancel() {
    this.cancel.emit();
  }
}

