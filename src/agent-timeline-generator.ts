import { Solution, Scenario, Task, AgentLine } from "./models";

export class AgentTimelineGenerator {

    private static colors = ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
        "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"];

    timelineTemplate = (timeline: any, index: number, timelineType: 'time' | 'distance', storageColor: string, agentIcon: string, solution: any, timeLabels: any[], distanceLabels: any[]) => `
   <div class="timeline-item flex-container items-center ${index % 2 === 0 ? 'even' : ''}">
      <div class="timeline-item-agent flex-container items-center padding-top-5 padding-bottom-5 ${timeline.hasLargeDescription ? 'wider' : ''}">
        <div>
          <button class="icon-button toggle-route-btn" data-agent-index="${timeline.agentIndex}" ${timeline.timelineLength ? '' : 'disabled'}>
            ${timeline.routeVisible && timeline.timelineLength ? `<i class="visibility-icon fas fa-eye black-06"></i>` : ''}
            ${!timeline.routeVisible && timeline.timelineLength ? `<i class="visibility-icon fas fa-eye-slash black-06"></i>` : ''}
            ${solution && !timeline.timelineLength ? `<i class="visibility-icon fas fa-exclamation-triangle" style="color: #ff6666;" title="Unassigned agent"></i>` : ''}
          </button>
        </div>
        <div style="color: ${timeline.color}" class="flex-main agent-info margin-right-10 flex-container column">
          <span class="mat-subtitle-2">${timeline.label}</span>
          <span class="mat-caption description" [matTooltip]="timeline.description">${timeline.description}</span>
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
        `<div class="solution-item" style="left: ${item.position};" data-tooltip="${item.description}"  matTooltipClass="solution-item-tooltip">
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
                                 task: Task,
                                 solution: Solution,
                                 scenario: Scenario,
                                 timeLabels: any[],
                                 distanceLabels: any[],
                                 onToggleRoute?: (timeline: any) => void) {
        hasLargeDescription = false;
        let agentIcon: string;
        let timelines;
        if (!task && solution) {
            agentIcon = this.getAgentIconByMode(solution.mode as any);
            const maxIndex = Math.max(...(solution.issues?.unassignedAgents || []), ...solution.agentPlans.map(agentPlan => agentPlan.agentIndex));

            // create timelines based on result
            timelines = [];
            for (let i = 0; i <= maxIndex; i++) {
                timelines.push({
                    label: `agent ${i + 1}`,
                    mode: solution.mode,
                    color: AgentTimelineGenerator.getAgentColorByIndex(i),
                    description: '',
                    routeVisible: true,
                    agentIndex: i
                })
            }
            let result = {
                agentIcon: agentIcon,
                hasLargeDescription: hasLargeDescription,
                timelines: timelines
            };
            this.drawTimelines(result, timelineType, solution, timeLabels, distanceLabels);
            return result;
        } else {
            agentIcon = scenario.agentIcon || this.getAgentIconByMode(scenario.mode);

            timelines = task.agents.map((agent: any, index: number) => {

                const label = `${scenario.agentLabel} ${index + 1}`;

                if (label.length >= 10) {
                    hasLargeDescription = true;
                }

                let result = {
                    label: label,
                    mode: scenario.mode,
                    color: agent.color,
                    description: this.generateAgentDescription(agent, scenario, hasLargeDescription).description,
                    routeVisible: true,
                    agentIndex: index
                }
                this.drawTimelines(result, timelineType, solution, timeLabels, distanceLabels);
                return result;
            });
            let result = {
                agentIcon: agentIcon,
                hasLargeDescription: hasLargeDescription,
                timelines: timelines
            };
            this.drawTimelines(result, timelineType, solution, timeLabels, distanceLabels);

            this.attachToggleRouteHandler(result.timelines, this.container, onToggleRoute);
            return result;
        }
    }

    public drawTimelines(result: any,
                         timelineType: 'time' | 'distance',
                         solution: Solution,
                         timeLabels: any[],
                         distanceLabels: any[]) {
        this.container.innerHTML = ''; // clear
        this.loadFontAwesome();

        result.timelines?.forEach((timeline: any, index: number) => {
            const html = this.timelineTemplate(timeline, index, timelineType, this.storageColor, result.agentIcon, solution, timeLabels, distanceLabels);
            this.container.insertAdjacentHTML('beforeend', html);
        });

        this.initializeGlobalTooltip();
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

    generateAgentDescription(agent: AgentLine, scenario: Scenario, hasLargeDescription: boolean) {
        const descriptionItems = [];

        if (agent.pickipCapacity && agent.deliveryCapacity) {
            descriptionItems.push(`${agent.pickipCapacity} ${scenario.capacityUnit} / ${agent.deliveryCapacity} ${scenario.capacityUnit}`)
        } else if (agent.pickipCapacity || agent.deliveryCapacity) {
            descriptionItems.push(`${agent.pickipCapacity || agent.deliveryCapacity} ${scenario.capacityUnit}`)
        }

        if (agent.timeframeWindows) {
            descriptionItems.push(agent.timeframeWindows.map((timeFrame: any[]) => `${this.toPrettyTime(timeFrame[0])}-${this.toPrettyTime(timeFrame[1])}`).join(', '));
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

    // TODO: extract this method to utils class, as it is used in other places
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
}
