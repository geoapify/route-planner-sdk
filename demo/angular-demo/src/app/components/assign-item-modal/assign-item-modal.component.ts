import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assign-item-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assign-item-modal.component.html',
  styleUrls: ['./assign-item-modal.component.css']
})
export class AssignItemModalComponent {
  @Input() itemType: 'job' | 'shipment' = 'job';
  @Input() itemId = '';
  @Input() allAgents: any[] = [];
  @Input() isLoading = false;

  @Output() assign = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  onAssign(agentIndex: number) {
    this.assign.emit(agentIndex);
  }

  onCancel() {
    this.cancel.emit();
  }
}

