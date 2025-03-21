import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RoutePlannerService } from "../services/route-planner.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  simpleRequestResult = "";

  constructor(private routePlannerService: RoutePlannerService) {}

  async makeSimpleRequest() {
    let result = await this.routePlannerService.makeSimpleRequest();
    this.simpleRequestResult = JSON.stringify(result);
  }
}
