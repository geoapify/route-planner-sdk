import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAssignStrategy, RemoveStrategy, REOPTIMIZE, PRESERVE_ORDER } from '../../../../../../src';

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-settings.component.html',
  styleUrls: ['./global-settings.component.css']
})
export class GlobalSettingsComponent {
  @Input() strategy: AddAssignStrategy = REOPTIMIZE;
  @Input() removeStrategy: RemoveStrategy = REOPTIMIZE;
  @Input() beforeWaypointIndex: number | null = null;
  @Input() afterWaypointIndex: number | null = null;
  @Input() beforeId = '';
  @Input() afterId = '';
  @Input() allowViolations = true;
  @Input() priority: number | null = null;
  @Input() appendToEnd = false;

  @Output() strategyChange = new EventEmitter<AddAssignStrategy>();
  @Output() removeStrategyChange = new EventEmitter<RemoveStrategy>();
  @Output() beforeWaypointIndexChange = new EventEmitter<number | null>();
  @Output() afterWaypointIndexChange = new EventEmitter<number | null>();
  @Output() beforeIdChange = new EventEmitter<string>();
  @Output() afterIdChange = new EventEmitter<string>();
  @Output() allowViolationsChange = new EventEmitter<boolean>();
  @Output() priorityChange = new EventEmitter<number | null>();
  @Output() appendToEndChange = new EventEmitter<boolean>();
  
  // Expose constants for template
  readonly REOPTIMIZE = REOPTIMIZE;
  readonly PRESERVE_ORDER = PRESERVE_ORDER;
}
