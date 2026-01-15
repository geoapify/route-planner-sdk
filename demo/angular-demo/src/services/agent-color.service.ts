import { Injectable } from '@angular/core';

/**
 * Centralized service for managing agent colors
 * Ensures consistent colors across map, agent cards, and timeline
 */
@Injectable({
  providedIn: 'root'
})
export class AgentColorService {
  private readonly AGENT_COLORS = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Turquoise
    '#34495e'  // Dark gray
  ];

  /**
   * Get color for an agent by their index
   * @param index The agent's index (0-based)
   * @returns Hex color code
   */
  getColorByIndex(index: number): string {
    return this.AGENT_COLORS[index % this.AGENT_COLORS.length];
  }

  /**
   * Get all available colors
   * @returns Array of hex color codes
   */
  getAllColors(): string[] {
    return [...this.AGENT_COLORS];
  }
}

