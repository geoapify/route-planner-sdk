import {
    AgentData,
    AgentSolutionData,
    RoutePlannerInputData, RoutePlannerResult,
    RoutePlannerResultData,
    Scenario, SolutionItem, SolutionLabel,
    WaypointData
} from "./models";
import { TimelineData, TimelineItem } from "./models/interfaces/timeline/timeline";

export class RoutePlannerTimeline {

    private static colors = ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
        "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"];

    timelineTemplate = (timelineData: TimelineData, timeline: TimelineItem, index: number, timelineType: 'time' | 'distance', storageColor: string, timeLabels: any[], distanceLabels: any[], solution?: RoutePlannerResultData) => `
   <div class="geoapify-rp-sdk-timeline-item flex-container items-center ${index % 2 === 0 ? 'geoapify-rp-sdk-even' : ''}">
      <div class="geoapify-rp-sdk-timeline-item-agent flex-container items-center padding-top-5 padding-bottom-5 ${timelineData.hasLargeDescription ? 'geoapify-rp-sdk-wider' : ''}">
        <div style="color: ${timeline.color}" class="flex-main geoapify-rp-sdk-agent-info margin-right-10 flex-container column">
          <span class="geoapify-rp-sdk-mat-subtitle-2">${timeline.label}</span>
          <span class="geoapify-rp-sdk-mat-caption description">${timeline.description}</span>
        </div>
      </div>
      <div class="geoapify-rp-sdk-timeline flex-main" style="margin-left: 10px; position: relative; height: 100%; min-height: 45px;">
        <div class="geoapify-rp-sdk-line"></div>
        ${timeline.timelineLength && timelineType === 'time' ? `<div class="geoapify-rp-sdk-value-line"
            style="background-color: ${timeline.color}; width: ${timeline.timelineLength}; left: ${timeline.timelineLeft};"></div>
        ` : ''}
        ${timeline.distanceLineLength && timelineType === 'distance' ? `<div class="geoapify-rp-sdk-value-line"
            style="background-color: ${timeline.color}; width: ${timeline.distanceLineLength};"></div>` : ''}


        ${timelineType === 'time' ? `
            ${(timeline.itemsByTime || []).map((item: any) =>
        `
              <div class="geoapify-rp-sdk-solution-item"
              style="left: ${item.position}; width: ${item.minWidth || ''}"
              data-tooltip="${item.description}">
            ${item.form === 'full' ? `<div class="geoapify-rp-sdk-solution-item-full" style="width: 100%; background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
            ${item.form === 'standard' ? `<div class="geoapify-rp-sdk-solution-item-standard" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
            ${item.form === 'minimal' ? `<div class="geoapify-rp-sdk-solution-item-minimal" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
          </div>`).join('')}

         ` : ''}

        ${timelineType === 'distance' ? `
           ${(timeline.itemsByDistance || []).map((item: any) =>
        `<div class="geoapify-rp-sdk-solution-item" style="left: ${item.position};" data-tooltip="${item.description}">
            <div class="geoapify-rp-sdk-solution-item-minimal" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>
          </div> `
    ).join('')}
          ` : ''}
        ${timeLabels && timelineType === 'time' ? `
            <div class="geoapify-rp-sdk-label-vertical-lines">
            ${(timeLabels || []).map(label => `
              <div class="geoapify-rp-sdk-label-vertical-line"  style="left: ${label.position};"></div>
              `).join('')}
            </div>
        ` : ''}

        ${distanceLabels && timelineType === 'distance' ? `
          <div class="geoapify-rp-sdk-label-vertical-lines">
          ${(distanceLabels || []).map(label =>
        `<div class="geoapify-rp-sdk-label-vertical-line"  style="left: ${label.position};"></div>`
    ).join('')}
          </div>
        ` : ''}
        <div id="global-tooltip" class="geoapify-rp-sdk-custom-tooltip" style="display: none;"></div>
      </div>
    </div>
`

    storageColor = '#ff9933';
    container: HTMLElement;
    result: RoutePlannerResult;
    options?: RoutePlannerTimeLineOptions;

    constructor(container: HTMLElement, result: RoutePlannerResult, options?: RoutePlannerTimeLineOptions){
        this.container = container;
        this.result = result;
        this.options = options;
    }

    public static getAgentColorByIndex(index: number): string {
        return this.colors[(index % this.colors.length + this.colors.length) % this.colors.length]
    }

    public generateAgentTimeline(timelineType: 'time' | 'distance',
                                 hasLargeDescription: boolean,
                                 task: RoutePlannerInputData,
                                 scenario: Scenario,
                                 timeLabels: SolutionLabel[],
                                 distanceLabels: SolutionLabel[],
                                 solution?: RoutePlannerResultData) {
        hasLargeDescription = false;
        let timelines: TimelineItem[];
        if (!task && solution) {
            const maxIndex = Math.max(...(solution.unassignedAgents || []), ...solution.agents.map(agentPlan => agentPlan.agentIndex));

            // create timelines based on result
            timelines = [];
            for (let i = 0; i <= maxIndex; i++) {
                timelines.push({
                    label: `agent ${i + 1}`,
                    mode: solution.inputData.mode,
                    color: RoutePlannerTimeline.getAgentColorByIndex(i),
                    description: '',
                    routeVisible: true,
                    agentIndex: i,
                    timelineLength: "",
                    distanceLineLength: "",
                    itemsByDistance: [],
                    itemsByTime: [],
                    timelineLeft: "100%"
                })
            }
            let result = {
                hasLargeDescription: hasLargeDescription,
                timelines: timelines
            };
            this.drawTimelines(result, timelineType, timeLabels, distanceLabels, scenario, solution);
            return result;
        } else {
            timelines = task.agents.map((agent: AgentData, index: number) => {

                const label = `${scenario.agentLabel} ${index + 1}`;

                if (label.length >= 10) {
                    hasLargeDescription = true;
                }

                return {
                    label: label,
                    mode: scenario.mode,
                    color: RoutePlannerTimeline.getAgentColorByIndex(index),
                    description: this.generateAgentDescription(agent, scenario, hasLargeDescription).description,
                    routeVisible: true,
                    agentIndex: index,
                    timelineLength: "",
                    distanceLineLength: "",
                    itemsByDistance: [],
                    itemsByTime: [],
                    timelineLeft: "100%"
                };
            });
            let result: TimelineData = {
                hasLargeDescription: hasLargeDescription,
                timelines: timelines
            };
            this.drawTimelines(result, timelineType, timeLabels, distanceLabels, scenario, solution);

            return result;
        }
    }

    public drawTimelines(result: TimelineData,
                         timelineType: 'time' | 'distance',
                         timeLabels: any[],
                         distanceLabels: any[],
                         scenario: Scenario,
                         solution?: RoutePlannerResultData) {
        if(result && solution) {
            this.generateTimelinesData(result, solution, scenario);
        }
        this.container.innerHTML = ''; // clear

        result.timelines?.forEach((timeline: TimelineItem, index: number) => {
            const html = this.timelineTemplate(result, timeline, index, timelineType, this.storageColor, timeLabels, distanceLabels, solution);
            this.container.insertAdjacentHTML('beforeend', html);
        });

        this.initializeGlobalTooltip();
    }

    private generateTimelinesData(result: TimelineData,
                                  solution: RoutePlannerResultData,
                                  scenario: Scenario) {
        const unit = scenario?.capacityUnit || 'items';
        let maxDistance = Math.max.apply(Math, solution.agents.map((agentPlan) => {
            return agentPlan.distance
        }));
        let maxTime = Math.max.apply(Math, solution.agents.map((agentPlan) => {
            return agentPlan.time + agentPlan.start_time
        }));
        solution.agents.forEach((agentPlan: AgentSolutionData) => {
            const timeline = result.timelines[agentPlan.agentIndex];
            timeline.timelineLength = ((agentPlan.time - (agentPlan.waypoints?.length ? agentPlan.waypoints[0].start_time : 0)) / maxTime * 100) + '%';
            timeline.distanceLineLength = (agentPlan.distance / maxDistance * 100) + '%';

            timeline.itemsByDistance = [];
            timeline.timelineLeft = (( agentPlan.start_time || ( agentPlan.waypoints?.length ? agentPlan.waypoints[0].start_time : 0 ) ) / maxTime * 100) + '%';

            this.generateItemsByTime(timeline, agentPlan, maxTime, solution, unit);
            this.generateItemsByDistance(timeline, agentPlan, maxDistance);
        });
    }

    private generateItemsByTime(timeline: TimelineItem,
                                agentPlan: AgentSolutionData,
                                maxTime: number,
                                solution: RoutePlannerResultData,
                                unit: string) {
        timeline.itemsByTime = [];
        agentPlan.waypoints.forEach((waypoint, index) => {
            const duration = (waypoint.duration || 0);
            const actualWidth = (duration / maxTime);

            const descriptionItems = [];

            const title = [...new Set(waypoint.actions.map(action => action.type.charAt(0).toUpperCase() + action.type.slice(1)))].join(' / ');
            descriptionItems.push(`${index + 1}: ${title}`);

            if (duration) {
                descriptionItems.push(`Duration: ${this.toPrettyTime(waypoint.duration)}`);
            }

            descriptionItems.push(`Time before: ${this.toPrettyTime(waypoint.start_time)}`);
            descriptionItems.push(`Time after: ${this.toPrettyTime(waypoint.start_time + duration)}`);

            const actionsData = waypoint.actions.map(action => {
                const description = [];
                if (action) {
                    let job = action.job_index && action.job_index >= 0 ? solution.inputData.jobs[action.job_index] : undefined;
                    if (job?.pickup_amount) {
                        description.push(`pickup ${job.pickup_amount} ${unit}`);
                    }
                    if (job?.delivery_amount) {
                        description.push(`deliver ${job.delivery_amount} ${unit}`);
                    }
                }


                let shipment = action.shipment_index && action.shipment_index >= 0 ? solution.inputData.shipments[action.shipment_index] : undefined
                if (shipment) {
                    if (shipment.amount) {
                        description.push(action.type === 'pickup' ? `pickup ${shipment.amount} ${unit}` : `deliver ${shipment.amount} ${unit}`)
                    }
                }

                return description.join(', ');
            }).filter((actionDescription) => actionDescription).join('; ');

            if (actionsData) {
                descriptionItems.push(`Actions: ${actionsData}`);
            }

            let isStorage = this.isWaypointStorage(waypoint);
            const timeItem: SolutionItem = {
                type: isStorage ? 'storage' : 'job',
                actualWidth: 100 * actualWidth + '%',
                position: (100 * (waypoint.start_time + duration / 2) / maxTime) + '%',
                form: 'full', // width > 30 ? 'full' : (width > 20 ? 'standard' : 'minimal'),
                minWidth: 100 * actualWidth + '%',// width > 30 ? 100 * actualWidth + '%' : (width > 20 ? '20px' : '10px'),
                description: descriptionItems.join('\n')
            }

            timeline.itemsByTime.push(timeItem);
        });
    }

    private isWaypointStorage(waypoint: WaypointData) {
        return waypoint.actions.some(action => action.location_index && action.location_index >= 0);
    }

    private generateItemsByDistance(timeline: TimelineItem,
                                    agentPlan: AgentSolutionData,
                                    maxDistance: number) {
        let distance = 0;
        agentPlan.legs.forEach((leg, index) => {
            const from = agentPlan.waypoints[leg.from_waypoint_index];
            const to = agentPlan.waypoints[leg.to_waypoint_index];

            if (index === 0) {

                const descriptionItems = [];
                const title = [...new Set(from.actions.map(action => action.type.charAt(0).toUpperCase() + action.type.slice(1)))].join(' / ');
                descriptionItems.push(title);

                descriptionItems.push('Distance traveled: 0');

                let isFromStorage = this.isWaypointStorage(from);
                const distanceItem: SolutionItem = {
                    type: isFromStorage ? 'storage' : 'job',
                    actualWidth: "0",
                    position: "0",
                    form: 'minimal',
                    minWidth: "10px",
                    description: descriptionItems.join('\n')
                }

                timeline.itemsByDistance.push(distanceItem);
            }

            distance += leg.distance;

            const descriptionItems = [];

            const title = [...new Set(to.actions.map(action => action.type.charAt(0).toUpperCase() + action.type.slice(1)))].join(' / ');
            descriptionItems.push(title);

            descriptionItems.push(`Distance traveled: ${this.toPrettyDistance(distance)}`);

            let isToStorage = this.isWaypointStorage(from);

            const distanceItem: SolutionItem = {
                type: isToStorage ? 'storage' : 'job',
                actualWidth: '0',
                position: (distance / maxDistance * 100) + '%',
                form: 'minimal',
                minWidth: "10px",
                description: descriptionItems.join('\n')
            }

            timeline.itemsByDistance.push(distanceItem);
        });
    }

    generateAgentDescription(agent: AgentData, scenario: Scenario, hasLargeDescription: boolean) {
        const descriptionItems = [];

        if (agent.pickup_capacity && agent.delivery_capacity) {
            descriptionItems.push(`${agent.pickup_capacity} ${scenario.capacityUnit} / ${agent.delivery_capacity} ${scenario.capacityUnit}`)
        } else if (agent.pickup_capacity || agent.delivery_capacity) {
            descriptionItems.push(`${agent.pickup_capacity || agent.delivery_capacity} ${scenario.capacityUnit}`)
        }

        if (agent.time_windows) {
            descriptionItems.push(agent.time_windows.map((timeFrame) => `${this.toPrettyTime(timeFrame[0])}-${this.toPrettyTime(timeFrame[1])}`).join(', '));
        }

        if (agent.capabilities) {
            descriptionItems.push(...agent.capabilities);
        }

        if (descriptionItems.join(", ").length > 20) {
            hasLargeDescription = true;
        }

        return {
            description: descriptionItems.join(', '),
            hasLargeDescription: hasLargeDescription
        };
    }

    toPrettyTime(sec_num: number): string {
        let hours: number | string = Math.floor(sec_num / 3600);
        let minutes: number | string = Math.floor((sec_num - (hours * 3600)) / 60);

        if (sec_num === 0) {
            return '0'
        }

        if (!hours) {
            return minutes + 'min';
        }

        if (!minutes) {
            return hours + 'h';
        }

        return hours + 'h ' + minutes + 'm';
    }

    initializeGlobalTooltip() {
        if (document.getElementById('global-tooltip-listener')) return; // already added

        const idMarker = document.createElement('div');
        idMarker.id = 'global-tooltip-listener';
        document.body.appendChild(idMarker);

        // Create global tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        tooltip.className = 'geoapify-rp-sdk-custom-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        // Mouse over handler
        document.addEventListener('mouseover', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const tooltipText = target.closest('.geoapify-rp-sdk-solution-item')?.getAttribute('data-tooltip');

            if (tooltipText) {
                const rect = target.getBoundingClientRect();
                tooltip.innerText = tooltipText;
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.clientX}px`;
                tooltip.style.top = `${rect.bottom + 6}px`;
                tooltip.classList.add('geoapify-rp-sdk-show');
            }
        });

        // Mouse out handler
        document.addEventListener('mouseout', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.geoapify-rp-sdk-solution-item')) {
                tooltip.classList.remove('geoapify-rp-sdk-show');
                tooltip.style.display = 'none';
            }
        });
    }

    toPrettyDistance(meters: number): string {
        if (meters > 10000) {
            return `${(meters / 1000).toFixed(1)} km`
        }

        if (meters > 5000) {
            return `${(meters / 1000).toFixed(2)} km`
        }

        return `${meters} m`
    }
}
