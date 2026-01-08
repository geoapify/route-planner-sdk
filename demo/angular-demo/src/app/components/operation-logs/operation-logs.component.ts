import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorLog } from '../../models/demo.types';

@Component({
  selector: 'app-operation-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operation-logs.component.html',
  styleUrls: ['./operation-logs.component.css']
})
export class OperationLogsComponent {
  @Input() logs: EditorLog[] = [];
  @Output() clear = new EventEmitter<void>();
}

