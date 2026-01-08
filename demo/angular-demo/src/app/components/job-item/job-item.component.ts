import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobInfo, AgentInfo } from '../../models/demo.types';

@Component({
  selector: 'app-job-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.css']
})
export class JobItemComponent {
  @Input() job!: JobInfo;
  @Output() selectionChange = new EventEmitter<void>();
}

