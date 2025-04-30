import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RoutePlannerService } from "../services/route-planner.service";
import { RoutePlannerTimelineLabel, RoutePlannerTimeline, Waypoint } from "../../../../dist";

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

  distanceLabels!: RoutePlannerTimelineLabel[];
  timeLabels!: RoutePlannerTimelineLabel[];

  rawDataForDrawingTimeline = '{"mode":"drive","agents":[{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]},{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]},{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]}],"shipments":[{"id":"order_1","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80223587256097,41.692045],"duration":120}},{"id":"order_2","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_3","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_4","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_5","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.81217323729341,41.694093300461546],"duration":120}},{"id":"order_6","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80284948206578,41.6939907],"duration":120}},{"id":"order_7","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79882656136182,41.69205345],"duration":120}},{"id":"order_8","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80086951415857,41.69484995],"duration":120}},{"id":"order_9","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.82100349999999,41.69336120046147],"duration":120}},{"id":"order_10","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79823826245833,41.69299355],"duration":120}},{"id":"order_11","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79875455107554,41.69260845],"duration":120}},{"id":"order_12","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_13","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_14","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_15","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79752501990028,41.69344205],"duration":120}},{"id":"order_16","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79752501990028,41.69344205],"duration":120}},{"id":"order_17","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_18","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_19","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_20","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79968626304391,41.69151135],"duration":120}},{"id":"order_21","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7992780816632,41.6921323],"duration":120}},{"id":"order_22","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7992780816632,41.6921323],"duration":120}},{"id":"order_23","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7992780816632,41.6921323],"duration":120}},{"id":"order_24","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79905844899226,41.6921251],"duration":120}},{"id":"order_25","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79913975708166,41.69264215],"duration":120}},{"id":"order_26","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79913975708166,41.69264215],"duration":120}},{"id":"order_27","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79913975708166,41.69264215],"duration":120}},{"id":"order_28","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.806901267842534,41.692131849999996],"duration":120}},{"id":"order_29","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.806901267842534,41.692131849999996],"duration":120}},{"id":"order_30","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.806901267842534,41.692131849999996],"duration":120}},{"id":"order_31","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80693947530342,41.69273855],"duration":120}},{"id":"order_32","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.806944938878466,41.69254330046141],"duration":120}},{"id":"order_33","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79667747680742,41.69228405],"duration":120}},{"id":"order_34","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79698107199418,41.69175190046134],"duration":120}},{"id":"order_35","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79698107199418,41.69175190046134],"duration":120}},{"id":"order_36","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80328556114039,41.69309485],"duration":120}},{"id":"order_37","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80328556114039,41.69309485],"duration":120}},{"id":"order_38","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.804188945660556,41.6916997],"duration":120}},{"id":"order_39","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.804188945660556,41.6916997],"duration":120}},{"id":"order_40","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80292548428854,41.6928931],"duration":120}},{"id":"order_41","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80292548428854,41.6928931],"duration":120}},{"id":"order_42","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80243802282037,41.69277235],"duration":120}},{"id":"order_43","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80243802282037,41.69277235],"duration":120}},{"id":"order_44","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80507228905727,41.6939231],"duration":120}},{"id":"order_45","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80324447976925,41.69218185],"duration":120}},{"id":"order_46","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79590953029308,41.69474105],"duration":120}},{"id":"order_47","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79590953029308,41.69474105],"duration":120}},{"id":"order_48","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.805705727931596,41.69432545],"duration":120}},{"id":"order_49","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.805705727931596,41.69432545],"duration":120}},{"id":"order_50","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.805705727931596,41.69432545],"duration":120}},{"id":"order_51","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80609475910855,41.69435735],"duration":120}},{"id":"order_52","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.806065553124995,41.6946249],"duration":120}},{"id":"order_53","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.803548338372096,41.6925705],"duration":120}},{"id":"order_54","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.802248473660775,41.6926464],"duration":120}},{"id":"order_55","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.802248473660775,41.6926464],"duration":120}},{"id":"order_56","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.802248473660775,41.6926464],"duration":120}},{"id":"order_57","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.803473378672,41.692026350000006],"duration":120}},{"id":"order_58","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.796250058123825,41.694078700000006],"duration":120}},{"id":"order_59","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7982309964476,41.69244465],"duration":120}},{"id":"order_60","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7982309964476,41.69244465],"duration":120}},{"id":"order_61","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7982309964476,41.69244465],"duration":120}},{"id":"order_62","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79804231287882,41.692694],"duration":120}},{"id":"order_63","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.797805389489824,41.69300455],"duration":120}},{"id":"order_64","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.797206033474325,41.692051750000005],"duration":120}},{"id":"order_65","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.797206033474325,41.692051750000005],"duration":120}},{"id":"order_66","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.797206033474325,41.692051750000005],"duration":120}},{"id":"order_67","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79632701664107,41.6916064],"duration":120}},{"id":"order_68","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80323003018576,41.6943037],"duration":120}},{"id":"order_69","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.803176710469444,41.6940678],"duration":120}},{"id":"order_70","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7953831230582,41.694231599999995],"duration":120}},{"id":"order_71","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79404622470484,41.6942502],"duration":120}},{"id":"order_72","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.7938719,41.6945844],"duration":120}},{"id":"order_73","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79651199087594,41.692556550000006],"duration":120}},{"id":"order_74","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79651199087594,41.692556550000006],"duration":120}},{"id":"order_75","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.81911887305633,41.692544999999996],"duration":120}},{"id":"order_76","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.8180584669929,41.69293625],"duration":120}},{"id":"order_77","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79517765373134,41.69264375],"duration":120}},{"id":"order_78","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.793632161562414,41.694728100461596],"duration":120}},{"id":"order_79","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.793632161562414,41.694728100461596],"duration":120}},{"id":"order_80","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.793632161562414,41.694728100461596],"duration":120}}],"locations":[{"id":"warehouse-0","location":[44.802171,41.6928772]}]}';

  constructor(private routePlannerService: RoutePlannerService) {}

  async makeSimpleRequest() {
    let result = await this.routePlannerService.makeSimpleRequest();
    this.simpleRequestResult = JSON.stringify(result);
  }

  async drawTimeline() {
    let result = await this.routePlannerService.planRoute(JSON.parse(this.rawDataForDrawingTimeline));

      const customWaypointPopupGenerator = (waypoint: Waypoint): HTMLElement => {
        const popupDiv = document.createElement('div');
        popupDiv.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <h4 style="margin: 0">${[...new Set(waypoint.getActions().map(action => action.getType().charAt(0).toUpperCase() + action.getType().slice(1)))].join(' / ')}</h4>
            <p style="margin: 0">Duration: ${this.toPrettyTime(waypoint.getDuration())|| 'N/A'}</p>
            <p style="margin: 0">Time Before: ${this.toPrettyTime(waypoint.getStartTime()) || 'N/A'}</p>
            <p style="margin: 0">Time after: ${this.toPrettyTime(waypoint.getStartTime() + waypoint.getDuration()) || 'N/A'}</p>
          </div>
          `;
        return popupDiv;
      };

    if(typeof result !== 'string') {
      this.generateLabels(100, 10);
      const generator = new RoutePlannerTimeline(this.timelinesContainer.nativeElement, result, {
        timelineType: 'time',
        hasLargeDescription: false,
        capacityUnit: 'liters',
        agentLabel: 'Truck',
        label: "Simple delivery route planner",
        description: "Deliver ordered items to customers within defined timeframe",
        timeLabels: this.timeLabels,
        distanceLabels: this.distanceLabels,
        showWaypointPopup: true,
        waypointPopupGenerator: customWaypointPopupGenerator,
        agentColors:["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
          "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"],
      });
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
