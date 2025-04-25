import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RoutePlannerService } from "../services/route-planner.service";
import { AgentTimelineGenerator, Scenario, SolutionLabel } from "../../../../dist";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild("timelinesContainer")
  timelinesContainer!: ElementRef;

  simpleRequestResult = "";

  distanceLabels!: SolutionLabel[];
  timeLabels!: SolutionLabel[];

  constructor(private routePlannerService: RoutePlannerService) {}

  async makeSimpleRequest() {
    let result = await this.routePlannerService.makeSimpleRequest();
    this.simpleRequestResult = JSON.stringify(result);

    if(typeof result !== 'string') {
      let task = result.getData().inputData;
      let scenario: Scenario = {
        mode: 'drive',
        agentIcon: 'truck',
        label: "Simple delivery route planner",
        description: "Deliver ordered items to customers within defined timeframe",
        agentLabel: 'Truck',
        capacityUnit: 'kg',
      };
      this.generateLabels(100, 10);
      let generator = new AgentTimelineGenerator(this.timelinesContainer.nativeElement)
      generator.generateAgentTimeline('time', false, task, result.getData(), scenario, this.timeLabels, this.distanceLabels, (timeline: any) => console.log(timeline));
    }
  }

  generateLabels(maxDistance: number, maxTime: number) {
    let timeStep;
    if (maxTime < 30 * 60) {
      timeStep = 5 * 60;
    } else if (maxTime < 60 * 60) {
      timeStep = 10 * 60;
    } else if (maxTime < 3 * 60 * 60) {
      timeStep = 20 * 60;
    } else if (maxTime < 10 * 60 * 60) {
      timeStep = 60 * 60;
    } else {
      timeStep = Math.round(maxTime / (10 * 60 * 60)) * 60 * 60;
    }

    let i = 1;
    this.timeLabels = [];
    while (timeStep * i < maxTime) {
      this.timeLabels.push({
        position: ((timeStep * i / maxTime) * 100) + "%",
        label: this.toPrettyTime(timeStep * i)
      });
      i++;
    }

    let distanceStep;

    if (maxDistance < 1000) {
      distanceStep = 100;
    } else if (maxDistance < 5000) {
      distanceStep = 500;
    } else if (maxDistance < 10000) {
      distanceStep = 1000;
    } else {
      distanceStep = Math.round(maxDistance / 10000) * 1000;
    }

    i = 1;
    this.distanceLabels = [];
    while (distanceStep * i < maxDistance) {
      this.distanceLabels.push({
        position: ((distanceStep * i / maxDistance) * 100) + "%",
        label: this.toPrettyDistance(distanceStep * i)
      });
      i++;
    }
  }

  toPrettyTime(sec_num: number) {
        let hours = Math.floor(sec_num / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        if (sec_num === 0) {
            return '0';
        }
        if (!hours) {
            return minutes + 'min';
        }
        if (!minutes) {
            return hours + 'h';
        }
        return hours + 'h ' + minutes + 'm';
    }

    toPrettyDistance(meters: number) {
        if (meters > 10000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        if (meters > 5000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${meters} m`;
    }
}
