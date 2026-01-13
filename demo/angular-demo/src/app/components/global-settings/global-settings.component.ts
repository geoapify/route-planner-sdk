import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAssignStrategy, RemoveStrategy } from '../../../../../../src';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-settings.component.html',
  styleUrls: ['./global-settings.component.css']
})
export class GlobalSettingsComponent {
  @Input() strategy: AddAssignStrategy = 'reoptimize';
  @Input() removeStrategy: RemoveStrategy = 'reoptimize';
  @Input() insertAtIndex: number | null = null;
  @Input() insertAfterId = '';
  @Input() insertBeforeId = '';
  @Input() allowViolations = true;
  @Input() priority: number | null = null;

  @Output() strategyChange = new EventEmitter<AddAssignStrategy>();
  @Output() removeStrategyChange = new EventEmitter<RemoveStrategy>();
  @Output() insertAtIndexChange = new EventEmitter<number | null>();
  @Output() insertAfterIdChange = new EventEmitter<string>();
  @Output() insertBeforeIdChange = new EventEmitter<string>();
  @Output() allowViolationsChange = new EventEmitter<boolean>();
  @Output() priorityChange = new EventEmitter<number | null>();
}

