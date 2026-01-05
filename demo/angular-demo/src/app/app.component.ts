import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditorOperationResult, RoutePlannerService } from "../services/route-planner.service";
import { 
  RoutePlannerTimelineLabel, 
  RoutePlannerTimeline, 
  Waypoint, 
  TimelineMenuItem,
  RoutePlannerResult,
  AgentSolution,
  AddAssignStrategy,
  RemoveStrategy
} from "../../../../src";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

interface AgentInfo {
  id: string | null;        // Actual agent ID (may be null if not set)
  displayName: string;      // Display name for UI
  index: number;            // Agent index (always available)
  jobCount: number;
  shipmentCount: number;
  distance: number;
  time: number;
}

interface EditorLog {
  timestamp: Date;
  operation: string;
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild("timelinesContainer")
  timelinesContainer!: ElementRef;

  simpleRequestResult = "";

  distanceLabels!: RoutePlannerTimelineLabel[];
  timeLabels!: RoutePlannerTimelineLabel[];

  rawDataForDrawingTimeline = '{"mode":"drive","agents":[{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]},{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]},{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]}],"shipments":[{"id":"order_1","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80223587256097,41.692045],"duration":120}},{"id":"order_2","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_3","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_4","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_5","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.81217323729341,41.694093300461546],"duration":120}},{"id":"order_6","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80284948206578,41.6939907],"duration":120}},{"id":"order_7","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79882656136182,41.69205345],"duration":120}},{"id":"order_8","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80086951415857,41.69484995],"duration":120}},{"id":"order_9","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.82100349999999,41.69336120046147],"duration":120}},{"id":"order_10","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79823826245833,41.69299355],"duration":120}},{"id":"order_11","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79875455107554,41.69260845],"duration":120}},{"id":"order_12","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_13","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_14","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_15","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79752501990028,41.69344205],"duration":120}},{"id":"order_16","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79752501990028,41.69344205],"duration":120}},{"id":"order_17","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_18","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_19","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_20","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79968626304391,41.69151135],"duration":120}}],"locations":[{"id":"warehouse-0","location":[44.802171,41.6928772]}]}';

  routePlannerTimeline: RoutePlannerTimeline | undefined;
  currentResult: RoutePlannerResult | undefined;

  agentVisibilityState: { [key: number]: boolean } = {};

  // Editor Testing State
  agentInfoList: AgentInfo[] = [];
  shipmentIds: string[] = [];
  editorLogs: EditorLog[] = [];
  isLoading = false;

  // Editor Form Controls
  selectedSourceAgent = -1;
  selectedTargetAgent = -1;  // Use index instead of string
  selectedShipmentIds: string[] = [];
  selectedStrategy: AddAssignStrategy = 'reoptimize';
  selectedRemoveStrategy: RemoveStrategy = 'reoptimize';
  insertAfterShipmentId = '';
  insertBeforeShipmentId = '';
  insertAtIndex: number | null = null;

  // New shipment form
  newShipmentId = 'new_order_1';
  newPickupLon = 44.802171;
  newPickupLat = 41.6928772;
  newDeliveryLon = 44.805;
  newDeliveryLat = 41.695;

  constructor(private routePlannerService: RoutePlannerService) {}

  async makeSimpleRequest() {
    let result = await this.routePlannerService.makeSimpleRequest();
    this.simpleRequestResult = JSON.stringify(result);
  }

  generateTask() {
    let inputData = JSON.parse(this.rawDataForDrawingTimeline);
    this.lightTheme();

    const customWaypointPopupGenerator = (waypoint: Waypoint): HTMLElement => {
      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <h4 style="margin: 0">${[...new Set(waypoint.getActions().map(action => action.getType().charAt(0).toUpperCase() + action.getType().slice(1)))].join(' / ')}</h4>
            <p style="margin: 0">Duration: ${this.toPrettyTime(waypoint.getDuration()) || 'N/A'}</p>
            <p style="margin: 0">Time Before: ${this.toPrettyTime(waypoint.getStartTime()) || 'N/A'}</p>
            <p style="margin: 0">Time after: ${this.toPrettyTime(waypoint.getStartTime() + waypoint.getDuration()) || 'N/A'}</p>
          </div>
          `;
      return popupDiv;
    };

    const agentActions: TimelineMenuItem[] = [
      {
        key: 'show-hide-agent',
        label: 'Hide',
        callback: (agentIndex: number) => {
          this.toggleAgentVisibility(agentIndex);
        }
      },
      {
        key: 'second-button',
        label: 'Test Button',
        disabled: true,
        callback: (agentIndex: number) => {
          console.log(`Agent : ${agentIndex} test button clicked`);
        }
      },
      {
        key: 'very-long-button',
        label: 'Very Very long Button',
        callback: (agentIndex: number) => {
          console.log(`Agent : ${agentIndex} long button clicked`);
        }
      }
    ];

    this.routePlannerTimeline = new RoutePlannerTimeline(this.timelinesContainer.nativeElement, inputData, undefined, {
      timelineType: 'time',
      hasLargeDescription: false,
      capacityUnit: 'liters',
      agentLabel: 'Truck',
      label: "Simple delivery route planner",
      description: "Deliver ordered items to customers within defined timeframe",
      timeLabels: this.timeLabels,
      showWaypointPopup: true,
      waypointPopupGenerator: customWaypointPopupGenerator,
      agentMenuItems: agentActions,
      agentColors: ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
        "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"],
    });
    
    this.createBeforeAgentMenuShowEventListener();
    
    this.routePlannerTimeline.on('onWaypointHover', (waypoint: Waypoint, agentIndex: number) => {
      console.log('Waypoint hovered via event system:', waypoint, 'Agent:', agentIndex);
    });
    
    this.routePlannerTimeline.on('onWaypointClick', (waypoint: Waypoint, agentIndex: number) => {
      console.log('Waypoint clicked via event system:', waypoint, 'Agent:', agentIndex);
    });
  }

  private createBeforeAgentMenuShowEventListener() {
    this.routePlannerTimeline?.on('beforeAgentMenuShow', (agentIndex: number, actions: TimelineMenuItem[]) => {
      return actions.map(action => {
        if (action.key === 'show-hide-agent') {
          return {
            ...action,
            label: this.agentVisibilityState[agentIndex] ? 'Show' : 'Hide'
          };
        }
        if (action.key === 'very-long-button') {
          return {
            ...action,
            hidden: agentIndex == 0
          };
        }
        return action;
      });
    });
  }

  async generateAndSolveTask() {
    this.isLoading = true;
    let inputData = JSON.parse(this.rawDataForDrawingTimeline);

    const customWaypointPopupGenerator = (waypoint: Waypoint): HTMLElement => {
      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <h4 style="margin: 0">${[...new Set(waypoint.getActions().map(action => action.getType().charAt(0).toUpperCase() + action.getType().slice(1)))].join(' / ')}</h4>
            <p style="margin: 0">Duration: ${this.toPrettyTime(waypoint.getDuration()) || 'N/A'}</p>
            <p style="margin: 0">Time Before: ${this.toPrettyTime(waypoint.getStartTime()) || 'N/A'}</p>
            <p style="margin: 0">Time after: ${this.toPrettyTime(waypoint.getStartTime() + waypoint.getDuration()) || 'N/A'}</p>
          </div>
          `;
      return popupDiv;
    };

    const agentActions: TimelineMenuItem[] = [
      {
        key: 'show-hide-agent',
        label: 'Hide',
        callback: (agentIndex: number) => {
          this.toggleAgentVisibility(agentIndex);
        }
      },
      {
        key: 'second-button',
        label: 'Test Button',
        callback: (agentIndex: number) => {
          console.log(`Agent : ${agentIndex} test button clicked`);
        }
      },
      {
        key: 'very-long-button',
        label: 'Very Very long Button',
        callback: (agentIndex: number) => {
          console.log(`Agent : ${agentIndex} long button clicked`);
        }
      }
    ];

    let result = await this.routePlannerService.planRoute(JSON.parse(this.rawDataForDrawingTimeline));

    if (typeof result !== 'string') {
      this.currentResult = result;
      this.updateAgentInfo();
      this.extractShipmentIds();
      
      let maxDistance = Math.max.apply(Math, result.getAgentSolutions().map((agentPlan) => {
        return agentPlan.getDistance()
      }));
      let maxTime = Math.max.apply(Math, result.getAgentSolutions().map((agentPlan) => {
        return agentPlan.getTime() + agentPlan.getStartTime()
      }));

      this.generateLabels(maxDistance, maxTime);
      this.routePlannerTimeline = new RoutePlannerTimeline(this.timelinesContainer.nativeElement, inputData, result, {
        timelineType: 'time',
        hasLargeDescription: false,
        capacityUnit: 'liters',
        agentLabel: 'Truck',
        label: "Simple delivery route planner",
        distanceLabels: this.distanceLabels,
        description: "Deliver ordered items to customers within defined timeframe",
        timeLabels: this.timeLabels,
        showWaypointPopup: true,
        waypointPopupGenerator: customWaypointPopupGenerator,
        agentMenuItems: agentActions,
        agentColors: ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
          "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"],
      });
      
      this.createBeforeAgentMenuShowEventListener();
      
      this.routePlannerTimeline.on('onWaypointHover', (waypoint: Waypoint) => {
        console.log('Waypoint hovered via event system:', waypoint);
      });

      this.addLog('Plan Route', true, 'Route optimization completed successfully');
    } else {
      this.addLog('Plan Route', false, result);
    }
    this.isLoading = false;
  }

  toggleAgentVisibility(agentIndex: number) {
    this.agentVisibilityState[agentIndex] = !this.agentVisibilityState[agentIndex];
    console.log(`Agent ${agentIndex} visibility toggled to:`, this.agentVisibilityState[agentIndex] ? 'visible' : 'hidden');
  }

  async solveTask() {
    this.isLoading = true;
    let result = await this.routePlannerService.planRoute(JSON.parse(this.rawDataForDrawingTimeline));

    if (typeof result !== 'string') {
      this.currentResult = result;
      this.updateAgentInfo();
      this.extractShipmentIds();

      let maxDistance = Math.max.apply(Math, result.getAgentSolutions().map((agentPlan) => { return agentPlan.getDistance() }));
      let maxTime = Math.max.apply(Math, result.getAgentSolutions().map((agentPlan) => { return agentPlan.getTime() + agentPlan.getStartTime() }));

      this.generateLabels(maxDistance, maxTime);
      this.routePlannerTimeline?.setDistanceLabels(this.distanceLabels);
      this.routePlannerTimeline?.setTimeLabels(this.timeLabels);

      this.routePlannerTimeline!.setResult(result);
      this.addLog('Solve Task', true, 'Task solved successfully');
    }
    this.isLoading = false;
  }

  // ============ EDITOR OPERATIONS ============

  async assignShipmentWithStrategy() {
    if (!this.currentResult || this.selectedTargetAgent < 0 || this.selectedShipmentIds.length === 0) {
      this.addLog('Assign Shipment', false, 'Missing required fields');
      return;
    }

    this.isLoading = true;
    const options: any = { strategy: this.selectedStrategy };
    
    if (this.selectedStrategy === 'insert') {
      if (this.insertAfterShipmentId) {
        options.afterId = this.insertAfterShipmentId;
      } else if (this.insertBeforeShipmentId) {
        options.beforeId = this.insertBeforeShipmentId;
      } else if (this.insertAtIndex !== null) {
        options.insertAtIndex = this.insertAtIndex;
      }
    }

    // Use agent index (number) instead of ID string
    const operationResult = await this.routePlannerService.assignShipments(
      this.currentResult,
      this.selectedTargetAgent,  // Pass index directly
      this.selectedShipmentIds,
      options
    );

    this.handleOperationResult(operationResult, 'Assign Shipment');
    this.isLoading = false;
  }

  async removeShipmentWithStrategy() {
    if (!this.currentResult || this.selectedShipmentIds.length === 0) {
      this.addLog('Remove Shipment', false, 'Missing required fields');
      return;
    }

    this.isLoading = true;
    const operationResult = await this.routePlannerService.removeShipments(
      this.currentResult,
      this.selectedShipmentIds,
      { strategy: this.selectedRemoveStrategy }
    );

    this.handleOperationResult(operationResult, 'Remove Shipment');
    this.isLoading = false;
  }

  async addNewShipmentWithStrategy() {
    if (!this.currentResult || this.selectedTargetAgent < 0) {
      this.addLog('Add New Shipment', false, 'Missing required fields');
      return;
    }

    this.isLoading = true;
    
    const newShipment = this.routePlannerService.createSampleShipment(
      this.newShipmentId,
      this.newPickupLon,
      this.newPickupLat,
      this.newDeliveryLon,
      this.newDeliveryLat
    );

    const options: any = { strategy: this.selectedStrategy };
    
    if (this.selectedStrategy === 'insert') {
      if (this.insertAfterShipmentId) {
        options.afterId = this.insertAfterShipmentId;
      } else if (this.insertBeforeShipmentId) {
        options.beforeId = this.insertBeforeShipmentId;
      } else if (this.insertAtIndex !== null) {
        options.insertAtIndex = this.insertAtIndex;
      }
    }

    // Use agent index (number) instead of ID string
    const operationResult = await this.routePlannerService.addNewShipments(
      this.currentResult,
      this.selectedTargetAgent,  // Pass index directly
      [newShipment],
      options
    );

    this.handleOperationResult(operationResult, 'Add New Shipment');
    
    // Increment the ID for next shipment
    const idNum = parseInt(this.newShipmentId.replace('new_order_', '')) || 0;
    this.newShipmentId = `new_order_${idNum + 1}`;
    
    this.isLoading = false;
  }

  async testAppendStrategy() {
    if (!this.currentResult) {
      this.addLog('Test Append', false, 'No result available');
      return;
    }

    this.isLoading = true;
    
    // Find source agent with shipments and a different target agent
    const { sourceAgent, targetAgent, shipmentToMove } = this.findAgentsForTest();
    
    if (shipmentToMove && sourceAgent !== null && targetAgent !== null) {
      const operationResult = await this.routePlannerService.assignShipments(
        this.currentResult,
        targetAgent,
        [shipmentToMove],
        { strategy: 'append' }
      );

      this.handleOperationResult(operationResult, `Append: Move ${shipmentToMove} from Agent ${sourceAgent} to Agent ${targetAgent}`);
    } else {
      const agentCount = this.agentInfoList.length;
      const agentsWithShipments = this.agentInfoList.filter(a => a.shipmentCount > 0).length;
      this.addLog('Test Append', false, `Need at least 1 agent with shipments and 2+ total agents. Found ${agentCount} agents (${agentsWithShipments} with shipments).`);
    }
    
    this.isLoading = false;
  }

  async testInsertStrategy() {
    if (!this.currentResult) {
      this.addLog('Test Insert', false, 'No result available');
      return;
    }

    this.isLoading = true;
    
    // Find source agent with shipments and a different target agent
    const { sourceAgent, targetAgent, shipmentToMove } = this.findAgentsForTest();
    
    if (shipmentToMove && sourceAgent !== null && targetAgent !== null) {
      const operationResult = await this.routePlannerService.assignShipments(
        this.currentResult,
        targetAgent,
        [shipmentToMove],
        { strategy: 'insert', insertAtIndex: 1 }
      );

      this.handleOperationResult(operationResult, `Insert: Move ${shipmentToMove} from Agent ${sourceAgent} to Agent ${targetAgent} at index 1`);
    } else {
      const agentCount = this.agentInfoList.length;
      const agentsWithShipments = this.agentInfoList.filter(a => a.shipmentCount > 0).length;
      this.addLog('Test Insert', false, `Need at least 1 agent with shipments and 2+ total agents. Found ${agentCount} agents (${agentsWithShipments} with shipments).`);
    }
    
    this.isLoading = false;
  }

  async testReoptimizeStrategy() {
    if (!this.currentResult) {
      this.addLog('Test Reoptimize', false, 'No result available');
      return;
    }

    this.isLoading = true;
    
    // Find source agent with shipments and a different target agent
    const { sourceAgent, targetAgent, shipmentToMove } = this.findAgentsForTest();
    
    if (shipmentToMove && sourceAgent !== null && targetAgent !== null) {
      const operationResult = await this.routePlannerService.assignShipments(
        this.currentResult,
        targetAgent,
        [shipmentToMove],
        { strategy: 'reoptimize' }
      );

      this.handleOperationResult(operationResult, `Reoptimize: Move ${shipmentToMove} from Agent ${sourceAgent} to Agent ${targetAgent}`);
    } else {
      const agentCount = this.agentInfoList.length;
      const agentsWithShipments = this.agentInfoList.filter(a => a.shipmentCount > 0).length;
      this.addLog('Test Reoptimize', false, `Need at least 1 agent with shipments and 2+ total agents. Found ${agentCount} agents (${agentsWithShipments} with shipments).`);
    }
    
    this.isLoading = false;
  }

  async testPreserveOrderRemoval() {
    if (!this.currentResult) {
      this.addLog('Test PreserveOrder', false, 'No result available');
      return;
    }

    this.isLoading = true;
    
    // Find any agent with shipments
    const { sourceAgent, shipmentToMove } = this.findAgentsForTest();
    
    if (shipmentToMove && sourceAgent !== null) {
      const operationResult = await this.routePlannerService.removeShipments(
        this.currentResult,
        [shipmentToMove],
        { strategy: 'preserveOrder' }
      );

      this.handleOperationResult(operationResult, `PreserveOrder Removal: Remove ${shipmentToMove} from Agent ${sourceAgent}`);
    } else {
      this.addLog('Test PreserveOrder', false, 'No shipments available in any agent');
    }
    
    this.isLoading = false;
  }

  /**
   * Find agents suitable for testing: one with shipments (source) and another as target
   * Target can be any other agent, even if unassigned
   */
  private findAgentsForTest(): { sourceAgent: number | null, targetAgent: number | null, shipmentToMove: string | null } {
    let sourceAgent: number | null = null;
    let targetAgent: number | null = null;
    let shipmentToMove: string | null = null;

    // Find first agent with shipments (will be our source)
    for (let i = 0; i < this.agentInfoList.length; i++) {
      const shipments = this.getShipmentsForAgent(i);
      if (shipments.length > 0) {
        sourceAgent = i;
        shipmentToMove = shipments[0];
        break;
      }
    }

    // Find a different agent as target - ANY other agent is fine (even if it's unassigned)
    // This allows testing moves to empty agents
    if (sourceAgent !== null && this.agentInfoList.length > 1) {
      for (let i = 0; i < this.agentInfoList.length; i++) {
        if (i !== sourceAgent) {
          targetAgent = i;
          break;
        }
      }
    }

    return { sourceAgent, targetAgent, shipmentToMove };
  }

  // ============ HELPER METHODS ============

  private handleOperationResult(operationResult: EditorOperationResult, operation: string) {
    this.addLog(operation, operationResult.success, operationResult.message);
    
    if (operationResult.success && operationResult.result) {
      this.currentResult = operationResult.result;
      this.updateAgentInfo();
      this.extractShipmentIds();
      this.updateTimeline();
    }
  }

  private updateTimeline() {
    if (this.routePlannerTimeline && this.currentResult) {
      let maxDistance = Math.max.apply(Math, this.currentResult.getAgentSolutions().map((agentPlan) => agentPlan.getDistance()));
      let maxTime = Math.max.apply(Math, this.currentResult.getAgentSolutions().map((agentPlan) => agentPlan.getTime() + agentPlan.getStartTime()));

      this.generateLabels(maxDistance, maxTime);
      this.routePlannerTimeline.setDistanceLabels(this.distanceLabels);
      this.routePlannerTimeline.setTimeLabels(this.timeLabels);
      this.routePlannerTimeline.setResult(this.currentResult);
    }
  }

  private updateAgentInfo() {
    if (!this.currentResult) return;
    
    // Get all agents (both assigned and unassigned)
    const data = this.currentResult.getData();
    const totalAgentCount = data.inputData.agents.length;
    const agentSolutionsByIndex = this.currentResult.getAgentSolutionsByIndex();
    
    // Build info for ALL agents
    this.agentInfoList = [];
    for (let i = 0; i < totalAgentCount; i++) {
      const solution = agentSolutionsByIndex[i];
      const agentData = data.inputData.agents[i];
      
      if (solution) {
        // Agent has assignments
        this.agentInfoList.push({
          id: solution.getAgentId() || null,
          displayName: solution.getAgentId() || `Agent ${i}`,
          index: i,
          jobCount: solution.getActions().filter(a => a.getType() === 'job').length,
          shipmentCount: solution.getActions().filter(a => a.getType() === 'pickup' || a.getType() === 'delivery').length / 2,
          distance: solution.getDistance(),
          time: solution.getTime()
        });
      } else {
        // Agent is unassigned
        this.agentInfoList.push({
          id: agentData.id || null,
          displayName: agentData.id || `Agent ${i}`,
          index: i,
          jobCount: 0,
          shipmentCount: 0,
          distance: 0,
          time: 0
        });
      }
    }

    // Use index for selection, not ID string
    if (this.agentInfoList.length > 0 && this.selectedTargetAgent < 0) {
      this.selectedTargetAgent = this.agentInfoList[0].index;
    }
  }

  private extractShipmentIds() {
    if (!this.currentResult) return;
    
    const shipmentSet = new Set<string>();
    this.currentResult.getAgentSolutions().forEach((solution: AgentSolution) => {
      solution.getActions().forEach(action => {
        const shipmentId = action.getShipmentId();
        if (shipmentId) {
          shipmentSet.add(shipmentId);
        }
      });
    });
    
    // Also add unassigned shipments
    const unassigned = this.currentResult.getUnassignedShipments();
    if (unassigned) {
      unassigned.forEach((s: any) => {
        if (s.id) shipmentSet.add(s.id);
      });
    }
    
    this.shipmentIds = Array.from(shipmentSet).sort();
  }

  private getShipmentsForAgent(agentIndex: number): string[] {
    if (!this.currentResult) return [];
    
    const solution = this.currentResult.getAgentSolutions()[agentIndex];
    if (!solution) return [];
    
    const shipmentSet = new Set<string>();
    solution.getActions().forEach(action => {
      const shipmentId = action.getShipmentId();
      if (shipmentId) {
        shipmentSet.add(shipmentId);
      }
    });
    
    return Array.from(shipmentSet);
  }

  private addLog(operation: string, success: boolean, message: string) {
    this.editorLogs.unshift({
      timestamp: new Date(),
      operation,
      success,
      message
    });
    
    // Keep only last 20 logs
    if (this.editorLogs.length > 20) {
      this.editorLogs.pop();
    }
  }

  clearLogs() {
    this.editorLogs = [];
  }

  toggleShipmentSelection(shipmentId: string) {
    const index = this.selectedShipmentIds.indexOf(shipmentId);
    if (index > -1) {
      this.selectedShipmentIds.splice(index, 1);
    } else {
      this.selectedShipmentIds.push(shipmentId);
    }
  }

  isShipmentSelected(shipmentId: string): boolean {
    return this.selectedShipmentIds.includes(shipmentId);
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

  lightTheme() {
    this.loadCssFile('assets/styles/timeline-minimal.css');
  }
  
  darkTheme() {
    this.loadCssFile('assets/styles/timeline-dark.css');
  }

  loadCssFile(path: string, id: string = 'theme-style') {
    let linkEl = document.getElementById(id) as HTMLLinkElement;

    if (linkEl) {
      linkEl.href = path;
    } else {
      linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.id = id;
      linkEl.href = path;
      document.head.appendChild(linkEl);
    }
  }
}
