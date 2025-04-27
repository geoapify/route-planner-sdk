import {
    AgentData,
    AgentSolutionData,
    RoutePlannerInputData,
    RoutePlannerResultData,
    Scenario, SolutionItem, SolutionLabel,
    WaypointData
} from "./models";
import { TimelineData, TimelineItem } from "./models/interfaces/agent-timeline/timeline";

export class AgentTimelineGenerator {

    private static colors = ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
        "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"];

    timelineTemplate = (timelineData: TimelineData, timeline: TimelineItem, index: number, timelineType: 'time' | 'distance', storageColor: string, agentIcon: string, solution: RoutePlannerResultData, timeLabels: any[], distanceLabels: any[]) => `
   <div class="timeline-item flex-container items-center ${index % 2 === 0 ? 'even' : ''}">
      <div class="timeline-item-agent flex-container items-center padding-top-5 padding-bottom-5 ${timelineData.hasLargeDescription ? 'wider' : ''}">
        <div>
          <button class="icon-button toggle-route-btn" data-agent-index="${timeline.agentIndex}" ${timeline.timelineLength ? '' : 'disabled'}>
            ${timeline.routeVisible && timeline.timelineLength ? `<i class="visibility-icon fas fa-eye black-06"></i>` : ''}
            ${!timeline.routeVisible && timeline.timelineLength ? `<i class="visibility-icon fas fa-eye-slash black-06"></i>` : ''}
            ${solution && !timeline.timelineLength ? `<i class="visibility-icon fas fa-exclamation-triangle" style="color: #ff6666;" title="Unassigned agent"></i>` : ''}
          </button>
        </div>
        <div style="color: ${timeline.color}" class="flex-main agent-info margin-right-10 flex-container column">
          <span class="mat-subtitle-2">${timeline.label}</span>
          <span class="mat-caption description">${timeline.description}</span>
        </div>
        <div style="color: ${timeline.color}" class="icon">
          <i class="fas fa-${agentIcon}"></i>
        </div>
      </div>
      <div class="timeline flex-main" style="margin-left: 10px; position: relative; height: 100%; min-height: 45px;">
        <div class="line"></div>
        ${timeline.timelineLength && timelineType === 'time' ? `<div class="value-line"
            style="background-color: ${timeline.color}; width: ${timeline.timelineLength}; left: ${timeline.timelineLeft};"></div>
        ` : ''}
        ${timeline.distanceLineLength && timelineType === 'distance' ? `<div class="value-line"
            style="background-color: ${timeline.color}; width: ${timeline.distanceLineLength};"></div>` : ''}


        ${timelineType === 'time' ? `
            ${(timeline.itemsByTime || []).map((item: any) =>
        `
              <div class="solution-item"
              style="left: ${item.position}; width: ${item.minWidth || ''}"
              data-tooltip="${item.description}">
            ${item.form === 'full' ? `<div class="solution-item-full" style="width: 100%; background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
            ${item.form === 'standard' ? `<div class="solution-item-standard" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
            ${item.form === 'minimal' ? `<div class="solution-item-minimal" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
          </div>`).join('')}

         ` : ''}

        ${timelineType === 'distance' ? `
           ${(timeline.itemsByDistance || []).map((item: any) =>
        `<div class="solution-item" style="left: ${item.position};" data-tooltip="${item.description}">
            <div class="solution-item-minimal" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>
          </div> `
    ).join('')}
          ` : ''}
        ${timeLabels && timelineType === 'time' ? `
            <div class="label-vertical-lines">
            ${(timeLabels || []).map(label => `
              <div class="label-vertical-line"  style="left: ${label.position};"></div>
              `).join('')}
            </div>
        ` : ''}

        ${distanceLabels && timelineType === 'distance' ? `
          <div class="label-vertical-lines">
          ${(distanceLabels || []).map(label =>
        `<div class="label-vertical-line"  style="left: ${label.position};"></div>`
    ).join('')}
          </div>
        ` : ''}
        <div id="global-tooltip" class="custom-tooltip" style="display: none;"></div>
      </div>
    </div>
`

    storageColor = '#ff9933';
    container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public static getAgentColorByIndex(index: number): string {
        return this.colors[(index % this.colors.length + this.colors.length) % this.colors.length]
    }

    public generateAgentTimeline(timelineType: 'time' | 'distance',
                                 hasLargeDescription: boolean,
                                 task: RoutePlannerInputData,
                                 solution: RoutePlannerResultData,
                                 scenario: Scenario,
                                 timeLabels: SolutionLabel[],
                                 distanceLabels: SolutionLabel[],
                                 onToggleRoute?: (timeline: any) => void) {
        hasLargeDescription = false;
        let agentIcon: string;
        let timelines: TimelineItem[];
        if (!task && solution) {
            agentIcon = this.getAgentIconByMode(solution.inputData.mode as any);
            const maxIndex = Math.max(...(solution.unassignedAgents || []), ...solution.agents.map(agentPlan => agentPlan.agentIndex));

            // create timelines based on result
            timelines = [];
            for (let i = 0; i <= maxIndex; i++) {
                timelines.push({
                    label: `agent ${i + 1}`,
                    mode: solution.inputData.mode,
                    color: AgentTimelineGenerator.getAgentColorByIndex(i),
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
                agentIcon: agentIcon,
                hasLargeDescription: hasLargeDescription,
                timelines: timelines
            };
            this.drawTimelines(result, timelineType, solution, timeLabels, distanceLabels, scenario);
            return result;
        } else {
            agentIcon = scenario.agentIcon || this.getAgentIconByMode(scenario.mode);

            timelines = task.agents.map((agent: AgentData, index: number) => {

                const label = `${scenario.agentLabel} ${index + 1}`;

                if (label.length >= 10) {
                    hasLargeDescription = true;
                }

                return {
                    label: label,
                    mode: scenario.mode,
                    color: AgentTimelineGenerator.getAgentColorByIndex(index),
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
                agentIcon: agentIcon,
                hasLargeDescription: hasLargeDescription,
                timelines: timelines
            };
            this.drawTimelines(result, timelineType, solution, timeLabels, distanceLabels, scenario);

            this.attachToggleRouteHandler(result.timelines, this.container, onToggleRoute);
            return result;
        }
    }

    public drawTimelines(result: TimelineData,
                         timelineType: 'time' | 'distance',
                         solution: RoutePlannerResultData,
                         timeLabels: any[],
                         distanceLabels: any[],
                         scenario: Scenario) {
        if(result && solution) {
            this.generateTimelinesData(result, solution, scenario);
        }
        this.container.innerHTML = ''; // clear
        this.loadFontAwesome();

        result.timelines?.forEach((timeline: TimelineItem, index: number) => {
            const html = this.timelineTemplate(result, timeline, index, timelineType, this.storageColor, result.agentIcon, solution, timeLabels, distanceLabels);
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

    private getAgentIconByMode(mode: 'drive' | 'truck' | 'bicycle' | 'walk'): string {
        const iconsMap = {
            'drive': 'car',
            'truck': 'truck',
            'bicycle': 'biking',
            'walk': 'walking'
        }

        return iconsMap[mode];
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

    loadFontAwesome() {
        const id = 'font-awesome-stylesheet';
        if (document.getElementById(id)) return; // already added

        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
        link.crossOrigin = 'anonymous';

        document.head.appendChild(link);
    }

    initializeGlobalTooltip() {
        if (document.getElementById('global-tooltip-listener')) return; // already added

        const idMarker = document.createElement('div');
        idMarker.id = 'global-tooltip-listener';
        document.body.appendChild(idMarker);

        // Create global tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        tooltip.className = 'custom-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        // Mouse over handler
        document.addEventListener('mouseover', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const tooltipText = target.closest('.solution-item')?.getAttribute('data-tooltip');

            if (tooltipText) {
                const rect = target.getBoundingClientRect();
                tooltip.innerText = tooltipText;
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.clientX}px`;
                tooltip.style.top = `${rect.bottom + 6}px`;
                tooltip.classList.add('show');
            }
        });

        // Mouse out handler
        document.addEventListener('mouseout', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.solution-item')) {
                tooltip.classList.remove('show');
                tooltip.style.display = 'none';
            }
        });
    }


    attachToggleRouteHandler(timelines: any[], container: HTMLElement, onToggleRoute?: (timeline: any) => void) {
        this.injectHoverStyle();
        if (container.dataset.clickListenerAttached === 'true') return;
        container.addEventListener('click', (e: MouseEvent) => {
            const button = (e.target as HTMLElement).closest('.toggle-route-btn') as HTMLElement;
            if (!button) return;

            const index = Number(button.getAttribute('data-agent-index'));
            const timeline = timelines.find(t => t.agentIndex === index);
            if (!timeline || !timeline.timelineLength) return;

            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }

            if (onToggleRoute) {
                onToggleRoute(timeline);
            }
        });
        container.dataset.clickListenerAttached = 'true';
    }

    injectHoverStyle() {
        const styleId = 'eye-button-hover-style';
        if (document.getElementById(styleId)) return; // avoid duplicates

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
    .timeline-item-agent .toggle-route-btn:active {
      background-color: #e0e0e0;
    }
    .timeline-item-agent .toggle-route-btn:hover {
       background-color: buttonface;
    }
  `;
        document.head.appendChild(style);
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
