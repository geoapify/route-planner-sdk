import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-violations-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './violations-display.component.html',
  styleUrls: ['./violations-display.component.css']
})
export class ViolationsDisplayComponent {
  @Input() violations: string[] = [];
  @Output() clear = new EventEmitter<void>();
}

