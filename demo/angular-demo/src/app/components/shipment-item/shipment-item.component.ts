import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipmentInfo, AgentInfo } from '../../models/demo.types';

@Component({
  selector: 'app-shipment-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipment-item.component.html',
  styleUrls: ['./shipment-item.component.css']
})
export class ShipmentItemComponent {
  @Input() shipment!: ShipmentInfo;
  @Output() selectionChange = new EventEmitter<void>();
}

