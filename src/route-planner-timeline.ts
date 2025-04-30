import {
    AgentData,
    AgentSolution,
    RoutePlannerResult,
    TravelMode,
    Waypoint,
    RoutePlannerTimelineOptions,
    TimelineItem,
    RoutePlannerTimelineLabel,
    Timeline,
} from "./models";

export class RoutePlannerTimeline {

    colors = ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
        "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"];
    storageColor = '#ff9933';

    timelineTemplate = (timeline: Timeline, index: number, timelineType: 'time' | 'distance', storageColor: string, timeLabels: RoutePlannerTimelineLabel[], distanceLabels: RoutePlannerTimelineLabel[]) => `
   <div class="geoapify-rp-sdk-timeline-item flex-container items-center ${index % 2 === 0 ? 'geoapify-rp-sdk-even' : ''}">
      <div class="geoapify-rp-sdk-timeline-item-agent flex-container items-center padding-top-5 padding-bottom-5 ${this.options.hasLargeDescription ? 'geoapify-rp-sdk-wider' : ''}">
       
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
            ${(timeline.itemsByTime || []).map((item: any, i: number) =>
        `
              <div class="geoapify-rp-sdk-solution-item"
              style="left: ${item.position}; width: ${item.minWidth || ''}" data-tooltip="${item.description}"
              data-agent-index="${timeline.agentIndex}" data-waypoint-index="${i}">
            ${item.form === 'full' ? `<div class="geoapify-rp-sdk-solution-item-full" style="width: 100%; background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
            ${item.form === 'standard' ? `<div class="geoapify-rp-sdk-solution-item-standard" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
            ${item.form === 'minimal' ? `<div class="geoapify-rp-sdk-solution-item-minimal" style="background-color: ${item.type === 'storage' ? storageColor : timeline.color};"></div>` : ''}
          </div>`).join('')}

         ` : ''}

        ${timelineType === 'distance' ? `
           ${(timeline.itemsByDistance || []).map((item: any, i: number) =>
        `<div class="geoapify-rp-sdk-solution-item" style="left: ${item.position};" data-tooltip="${item.description}"
              data-agent-index="${timeline.agentIndex}" data-waypoint-index="${i}">
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

    container: HTMLElement;
    result: RoutePlannerResult;
    options: RoutePlannerTimelineOptions;
    waypointPopupContainer: HTMLElement | null = null;

    constructor(container: HTMLElement,
                result: RoutePlannerResult,
                options?: RoutePlannerTimelineOptions) {
        this.container = container;
        this.result = result;
        if(options) {
            this.options = options;
        } else {
            this.options = {
                hasLargeDescription: false,
                timelineType: 'time',
                agentColors: this.colors,
                capacityUnit: 'items'
            };
        }
        this.generateAgentTimeline();
    }

    public getAgentColorByIndex(index: number): string {
        return this.colors[(index % this.colors.length + this.colors.length) % this.colors.length]
    }

    public generateAgentTimeline() {
        let timelines: Timeline[];
        if (this.result && !this.result.getRawData()) {
            const maxIndex = Math.max(...(this.result.getUnassignedAgents() || []), ...this.result.getAgentSolutions().map(agentPlan => agentPlan.getAgentIndex()));

            // create timelines based on result
            timelines = [];
            for (let i = 0; i <= maxIndex; i++) {
                timelines.push({
                    label: `${this.options.agentLabel ? this.options.agentLabel : 'agent'} ${i + 1}`,
                    mode: this.result.getData().inputData.mode,
                    color: this.getAgentColorByIndex(i),
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

            this.drawTimelines(timelines, this.result);
            return timelines;
        } else {
            timelines = this.result.getData().inputData.agents.map((agent: AgentData, index: number) => {

                const label = `${this.options.agentLabel ? this.options.agentLabel : 'Agent'} ${index + 1}`;

                if (label.length >= 10) {
                    this.options.hasLargeDescription = true;
                }

                return {
                    label: label,
                    mode: this.result.getRawData().properties.mode as TravelMode,
                    color: this.getAgentColorByIndex(index),
                    description: this.generateAgentDescription(agent, this.options.hasLargeDescription!).description,
                    routeVisible: true,
                    agentIndex: index,
                    timelineLength: "",
                    distanceLineLength: "",
                    itemsByDistance: [],
                    itemsByTime: [],
                    timelineLeft: "100%"
                };
            });

            this.drawTimelines(timelines, this.result);
            return timelines;
        }
    }

    public drawTimelines(timelines: Timeline[],
                         solution?: RoutePlannerResult) {
        if(timelines && solution) {
            this.generateTimelinesData(timelines, this.result);
        }
        this.container.innerHTML = ''; // clear

        timelines?.forEach((timeline: Timeline, index: number) => {
            const html = this.timelineTemplate(timeline, index, this.options.timelineType!, this.storageColor, this.options.timeLabels || [], this.options.distanceLabels || []);
            this.container.insertAdjacentHTML('beforeend', html);
        });

        if(this.options.showWaypointPopup) {
            if(this.options.waypointPopupGenerator) {
                this.initializeWaypointPopups();
            } else {
                this.initializeGlobalTooltip();
            }
        }
    }

    private generateTimelinesData(timelines: Timeline[],
                                  result: RoutePlannerResult) {
        const unit = this.options.capacityUnit || 'items';
        let maxDistance = Math.max.apply(Math, result.getAgentSolutions().map((agentPlan) => {
            return agentPlan.getDistance()
        }));
        let maxTime = Math.max.apply(Math, result.getAgentSolutions().map((agentPlan) => {
            return agentPlan.getTime() + agentPlan.getStartTime()
        }));
        result.getAgentSolutions().forEach((agentPlan: AgentSolution) => {
            const timeline = timelines[agentPlan.getAgentIndex()];
            timeline.timelineLength = ((agentPlan.getTime() - (agentPlan.getWaypoints()?.length ? agentPlan.getWaypoints()[0].getStartTime() : 0)) / maxTime * 100) + '%';
            timeline.distanceLineLength = (agentPlan.getDistance() / maxDistance * 100) + '%';

            timeline.itemsByDistance = [];
            timeline.timelineLeft = (( agentPlan.getStartTime() || ( agentPlan.getWaypoints()?.length ? agentPlan.getWaypoints()[0].getStartTime() : 0 ) ) / maxTime * 100) + '%';

            this.generateItemsByTime(timeline, agentPlan, maxTime, result, unit);
            this.generateItemsByDistance(timeline, agentPlan, maxDistance);
        });
    }

    private generateItemsByTime(timeline: Timeline,
                                agentPlan: AgentSolution,
                                maxTime: number,
                                solution: RoutePlannerResult,
                                unit: string) {
        timeline.itemsByTime = [];
        agentPlan.getWaypoints().forEach((waypoint: Waypoint, index: number) => {
            const duration = (waypoint.getDuration() || 0);
            const actualWidth = (duration / maxTime);

            const descriptionItems = [];

            const title = [...new Set(waypoint.getActions().map(action => action.getType().charAt(0).toUpperCase() + action.getType().slice(1)))].join(' / ');
            descriptionItems.push(`${index + 1}: ${title}`);

            if (duration) {
                descriptionItems.push(`Duration: ${this.toPrettyTime(waypoint.getDuration())}`);
            }

            descriptionItems.push(`Time before: ${this.toPrettyTime(waypoint.getStartTime())}`);
            descriptionItems.push(`Time after: ${this.toPrettyTime(waypoint.getStartTime() + duration)}`);

            const actionsData = waypoint.getActions().map(action => {
                const description = [];
                if (action) {
                    let job = action.getJobIndex() && action.getJobIndex()! >= 0 ? solution.getData().inputData.jobs[action.getJobIndex()!] : undefined;
                    if (job?.pickup_amount) {
                        description.push(`pickup ${job.pickup_amount} ${unit}`);
                    }
                    if (job?.delivery_amount) {
                        description.push(`deliver ${job.delivery_amount} ${unit}`);
                    }
                }


                let shipment = action.getShipmentIndex() && action.getShipmentIndex()! >= 0 ? solution.getData().inputData.shipments[action.getShipmentIndex()!] : undefined
                if (shipment) {
                    if (shipment.amount) {
                        description.push(action.getType() === 'pickup' ? `pickup ${shipment.amount} ${unit}` : `deliver ${shipment.amount} ${unit}`)
                    }
                }

                return description.join(', ');
            }).filter((actionDescription) => actionDescription).join('; ');

            if (actionsData) {
                descriptionItems.push(`Actions: ${actionsData}`);
            }

            let isStorage = this.isWaypointStorage(waypoint);
            const timeItem: TimelineItem = {
                type: isStorage ? 'storage' : 'job',
                actualWidth: 100 * actualWidth + '%',
                position: (100 * (waypoint.getStartTime() + duration / 2) / maxTime) + '%',
                form: 'full', // width > 30 ? 'full' : (width > 20 ? 'standard' : 'minimal'),
                minWidth: 100 * actualWidth + '%',// width > 30 ? 100 * actualWidth + '%' : (width > 20 ? '20px' : '10px'),
                description: descriptionItems.join('\n')
            }

            timeline.itemsByTime.push(timeItem);
        });
    }

    private isWaypointStorage(waypoint: Waypoint) {
        return waypoint.getActions().some(action => action.getLocationIndex() && action.getLocationIndex()! >= 0);
    }

    private generateItemsByDistance(timeline: Timeline,
                                    agentPlan: AgentSolution,
                                    maxDistance: number) {
        let distance = 0;
        agentPlan.getLegs().forEach((leg, index) => {
            const from = agentPlan.getWaypoints()[leg.getFromWaypointIndex()];
            const to = agentPlan.getWaypoints()[leg.getToWaypointIndex()];

            if (index === 0) {

                const descriptionItems = [];
                const title = [...new Set(from.getActions().map(action => action.getType().charAt(0).toUpperCase() + action.getType().slice(1)))].join(' / ');
                descriptionItems.push(title);

                descriptionItems.push('Distance traveled: 0');

                let isFromStorage = this.isWaypointStorage(from);
                const distanceItem: TimelineItem = {
                    type: isFromStorage ? 'storage' : 'job',
                    actualWidth: "0",
                    position: "0",
                    form: 'minimal',
                    minWidth: "10px",
                    description: descriptionItems.join('\n')
                }

                timeline.itemsByDistance.push(distanceItem);
            }

            distance += leg.getDistance();

            const descriptionItems = [];

            const title = [...new Set(to.getActions().map(action => action.getType().charAt(0).toUpperCase() + action.getType().slice(1)))].join(' / ');
            descriptionItems.push(title);

            descriptionItems.push(`Distance traveled: ${this.toPrettyDistance(distance)}`);

            let isToStorage = this.isWaypointStorage(from);

            const distanceItem: TimelineItem = {
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

    generateAgentDescription(agent: AgentData, hasLargeDescription: boolean) {
        const descriptionItems = [];

        if (agent.pickup_capacity && agent.delivery_capacity) {
            descriptionItems.push(`${agent.pickup_capacity} ${this.options.capacityUnit} / ${agent.delivery_capacity} ${this.options.capacityUnit}`)
        } else if (agent.pickup_capacity || agent.delivery_capacity) {
            descriptionItems.push(`${agent.pickup_capacity || agent.delivery_capacity} ${this.options.capacityUnit}`)
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
    private createWaypointPopupContainer() {
        if (this.waypointPopupContainer) return;

        this.waypointPopupContainer = document.createElement('div');
        this.waypointPopupContainer.id = 'geoapify-rp-sdk-waypoint-popup';
        this.waypointPopupContainer.className = 'geoapify-rp-sdk-custom-tooltip';
        this.waypointPopupContainer.style.opacity = '1';

        document.body.appendChild(this.waypointPopupContainer);
        document.addEventListener('mouseover', (e: MouseEvent) => {
            if (!this.waypointPopupContainer || this.waypointPopupContainer.style.display === 'none') {
                return;
            }

            const target = e.target as HTMLElement;

            // Check if the hover was outside the popup container AND outside a trigger element
            const hoverInsidePopup = this.waypointPopupContainer.contains(target);
            const hoverOnTrigger = target.closest('.geoapify-rp-sdk-solution-item') !== null;

            if (!hoverInsidePopup && !hoverOnTrigger) {
                this.hideWaypointPopup();
            }
        });
    }
    private initializeWaypointPopups() {
        this.createWaypointPopupContainer();

        this.container.addEventListener('mouseover', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const waypointElement = target.closest('.geoapify-rp-sdk-solution-item');

            if (waypointElement) {
                const agentIndex = waypointElement.getAttribute('data-agent-index');
                const waypointIndex = waypointElement.getAttribute('data-waypoint-index');

                if (agentIndex !== null && waypointIndex !== null) {
                    const agentSolution = this.result.getAgentSolutions().find(sol => sol.getAgentIndex() === +agentIndex);

                    if (agentSolution) {
                        const waypoint = agentSolution.getWaypoints()[+waypointIndex];
                        if (this.options.waypointPopupGenerator) {
                            try {
                                const popupContentElement = this.options.waypointPopupGenerator(waypoint);
                                this.showWaypointPopup(waypointElement, popupContentElement);
                            } catch (error) {
                                console.error('Error generating waypoint popup content:', error);
                            }
                        } else {
                            this.hideWaypointPopup();
                        }
                    }
                }
            }
        });
    }

    private showWaypointPopup(triggerElement: Element, contentElement: HTMLElement) {
        if (!this.waypointPopupContainer) {
            console.error('Waypoint popup container not initialized.');
            return;
        }

        this.waypointPopupContainer.innerHTML = '';
        this.waypointPopupContainer.appendChild(contentElement);
        const rect = triggerElement.getBoundingClientRect();
        this.waypointPopupContainer.style.top = `${rect.bottom + window.scrollY + 10}px`;
        let left = rect.left + window.scrollX + (rect.width / 2) - (this.waypointPopupContainer.offsetWidth / 2);

        const viewportWidth = window.innerWidth;
        const popupWidth = this.waypointPopupContainer.offsetWidth;

        if (left + popupWidth > viewportWidth - 10) {
            left = viewportWidth - popupWidth - 10;
        }
        if (left < 10) {
            left = 10;
        }

        this.waypointPopupContainer.style.left = `${left}px`;
        this.waypointPopupContainer.style.display = 'block';
    }

    private hideWaypointPopup() {
        if (this.waypointPopupContainer) {
            this.waypointPopupContainer.style.display = 'none';
        }
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
