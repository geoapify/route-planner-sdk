import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { EditorOperationResult, RoutePlannerService } from "../services/route-planner.service";
import { AgentColorService } from "../services/agent-color.service";
import { 
  RoutePlannerTimeline, 
  RoutePlannerResult,
  AddAssignStrategy,
  RemoveStrategy,
  Job,
  Shipment,
  ShipmentStep,
  AddAssignOptions,
  REOPTIMIZE,
  PRESERVE_ORDER
} from "../../../../src";
import TEST_API_KEY from "../../../../env-variables";

import { AgentInfo, EditorLog } from "./models/demo.types";
import { AgentCardComponent } from "./components/agent-card/agent-card.component";
import { ViolationsDisplayComponent } from "./components/violations-display/violations-display.component";
import { IssuesDisplayComponent } from "./components/issues-display/issues-display.component";
import { OperationLogsComponent } from "./components/operation-logs/operation-logs.component";
import { GlobalSettingsComponent } from "./components/global-settings/global-settings.component";
import { AddJobModalComponent, AddJobData, JobModalOptions } from "./components/add-job-modal/add-job-modal.component";
import { AddShipmentModalComponent, AddShipmentData, ShipmentModalOptions } from "./components/add-shipment-modal/add-shipment-modal.component";
import { AssignItemModalComponent } from "./components/assign-item-modal/assign-item-modal.component";
import { RouteMapComponent } from "./components/route-map/route-map.component";
import { TimelineMenuItem } from "../../../../src";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    CommonModule, 
    FormsModule,
    AgentCardComponent,
    ViolationsDisplayComponent,
    IssuesDisplayComponent,
    OperationLogsComponent,
    GlobalSettingsComponent,
    AddJobModalComponent,
    AddShipmentModalComponent,
    AssignItemModalComponent,
    RouteMapComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild("timelinesContainer") timelinesContainer!: ElementRef;
  @ViewChild(RouteMapComponent) routeMapComponent!: RouteMapComponent;

  currentResult: RoutePlannerResult | undefined;
  routePlannerTimeline: RoutePlannerTimeline | undefined;
  agentInfoList: AgentInfo[] = [];
  editorLogs: EditorLog[] = [];
  isLoading = false;
  apiKey = TEST_API_KEY;
  isValidationScenario = false;
  agentVisibilityState: Map<number, boolean> = new Map(); // Track route visibility per agent

  // Global Settings
  selectedStrategy: AddAssignStrategy = REOPTIMIZE;
  selectedRemoveStrategy: RemoveStrategy = REOPTIMIZE;
  beforeId = '';
  afterId = '';
  beforeWaypointIndex: number | null = null;
  afterWaypointIndex: number | null = null;
  allowViolations = true;
  priority: number | null = null;
  appendToEnd = false;
  
  // Expose constants for template
  readonly REOPTIMIZE = REOPTIMIZE;
  readonly PRESERVE_ORDER = PRESERVE_ORDER;

  // Add job/shipment modal state
  showAddJobModal = false;
  showAddShipmentModal = false;
  activeAgentForAdd: number | null = null;
  mapClickCoordinates: { lon: number; lat: number } | null = null;
  
  // Assign unassigned items modal state
  showAssignJobModal = false;
  showAssignShipmentModal = false;
  jobIndexToAssign: number | null = null;
  shipmentIndexToAssign: number | null = null;

  constructor(
    private routePlannerService: RoutePlannerService,
    private agentColorService: AgentColorService
  ) {}

  // ============ SCENARIO GENERATION ============

  async generateAndSolveTask() {
    this.isLoading = true;
    this.isValidationScenario = false;
    
    const result = await this.routePlannerService.createLargeTestScenario();
    
    if (typeof result !== 'string') {
      this.currentResult = result;
      this.updateAgentInfo();
      this.addLog('Generate & Solve', true, '20 shipments optimized for 3 agents');
    } else {
      this.addLog('Generate & Solve', false, result);
    }
    
    this.isLoading = false;
  }

  async generateValidationTestScenario() {
    this.isLoading = true;
    this.isValidationScenario = true;
    
    const result = await this.routePlannerService.createValidationTestScenario();
    
    if (typeof result !== 'string') {
      this.currentResult = result;
      this.updateAgentInfo();
      this.addLog('Generate Validation Scenario', true, '3 constrained agents created');
    } else {
      this.addLog('Generate Validation Scenario', false, result);
    }
    
    this.isLoading = false;
  }

  // ============ VALIDATION TESTS ============

  async testMissingCapability() {
    const job = new Job()
      .setId(`test-refrigerated-${Date.now()}`)
      .setLocation(-77.0330, 38.9100)  // Washington, DC
      .addRequirement('refrigerated')
      .setDeliveryAmount(100);
    
    await this.addJobAndShowResult(job, 'Missing Capability Test', 0);
  }

  async testCapacityExceeded() {
    const job = new Job()
      .setId(`test-heavy-${Date.now()}`)
      .setLocation(-77.0340, 38.9095)  // Washington, DC
      .setDeliveryAmount(600);
    
    await this.addJobAndShowResult(job, 'Capacity Exceeded Test', 0);
  }

  async testTimeWindowViolation() {
    const job = new Job()
      .setId(`test-evening-${Date.now()}`)
      .setLocation(-77.0360, 38.9085)  // Washington, DC
      .addTimeWindow(32400, 39600)  // 9h to 11h after start (outside 8h shift)
      .setDeliveryAmount(50);
    
    await this.addJobAndShowResult(job, 'Time Window Violation Test', 0);
  }

  async testBreakViolation() {
    const job = new Job()
      .setId(`test-lunch-${Date.now()}`)
      .setLocation(-77.0375, 38.9070)  // Washington, DC
      .addTimeWindow(11400, 13500)  // 3h10m to 3h45m (during lunch break: 3h-4h)
      .setDeliveryAmount(50);
    
    await this.addJobAndShowResult(job, 'Break Violation Test', 1);
  }

  async testMultipleViolations() {
    const job = new Job()
      .setId(`test-multi-${Date.now()}`)
      .setLocation(-77.0385, 38.9065)  // Washington, DC
      .addRequirement('refrigerated')
      .addRequirement('hazmat')
      .addTimeWindow(32400, 39600)  // 9h to 11h after start (outside 8h shift)
      .setDeliveryAmount(600);
    
    await this.addJobAndShowResult(job, 'Multiple Violations Test', 0);
  }

  async testShipmentCapacityExceeded() {
    const shipment = new Shipment()
      .setId(`test-heavy-shipment-${Date.now()}`)
      .setPickup(new ShipmentStep().setLocation(-77.0369, 38.9072).setDuration(120))  // Washington, DC
      .setDelivery(new ShipmentStep().setLocation(-77.0395, 38.9058).setDuration(120))  // Washington, DC
      .setAmount(600);  // Exceeds capacity
    
    await this.addShipmentAndShowResult(shipment, 'Shipment Capacity Test', 2);
  }

  async testShipmentMissingCapability() {
    const shipment = new Shipment()
      .setId(`test-refrigerated-shipment-${Date.now()}`)
      .setPickup(new ShipmentStep().setLocation(-77.0369, 38.9072).setDuration(120))  // Washington, DC
      .setDelivery(new ShipmentStep().setLocation(-77.0320, 38.9102).setDuration(120))  // Washington, DC
      .addRequirement('refrigerated')
      .setAmount(50);
    
    await this.addShipmentAndShowResult(shipment, 'Shipment Missing Capability Test', 0);
  }

  private async addJobAndShowResult(job: Job, testName: string, agentIndex: number) {
    if (!this.currentResult) return;
    
    this.isLoading = true;
    const result = await this.routePlannerService.addNewJobs(
      this.currentResult,
      agentIndex,
      [job],
      this.buildOptions()
    );
    
    this.handleOperationResult(result, testName);
    this.isLoading = false;
  }

  private async addShipmentAndShowResult(shipment: Shipment, testName: string, agentIndex: number) {
    if (!this.currentResult) return;
    
    this.isLoading = true;
    const result = await this.routePlannerService.addNewShipments(
      this.currentResult,
      agentIndex,
      [shipment],
      this.buildOptions()
    );
    
    this.handleOperationResult(result, testName);
    this.isLoading = false;
  }

  // ============ MOVE OPERATIONS ============

  async moveSelectedItems(event: { fromAgent: number, toAgent: number }) {
    if (!this.currentResult) return;
    
    const agent = this.agentInfoList[event.fromAgent];
    const selectedJobs = agent.jobs.filter(j => j.selected);
    const selectedShipments = agent.shipments.filter(s => s.selected);
    
    if (selectedJobs.length === 0 && selectedShipments.length === 0) return;
    
    this.isLoading = true;
    const options = this.buildOptions();
    
    // Get indexes for selected items
    const jobIndexes = selectedJobs.map(j => j.index);
    const shipmentIndexes = selectedShipments.map(s => s.index);
    
    // Move jobs first (if any)
    if (jobIndexes.length > 0) {
      const result = await this.routePlannerService.assignJobs(
        this.currentResult,
        event.toAgent,
        jobIndexes,
        options
      );
      
      if (result.success && result.result) {
        this.currentResult = result.result;
        this.updateAgentInfo();  // Update immediately
        this.addLog(`Move Jobs`, true, `${jobIndexes.length} job(s) moved to Agent ${event.toAgent}`);
      } else {
        this.addLog(`Move Jobs`, false, result.message);
        this.isLoading = false;
        this.updateAgentInfo();
        return;
      }
    }
    
    // Get fresh shipment list after job move (reoptimize may have moved shipments)
    const updatedAgent = this.agentInfoList[event.fromAgent];
    const stillOnThisAgent = updatedAgent.shipments.filter(s => shipmentIndexes.includes(s.index));
    
    // Only move shipments still on source agent
    if (stillOnThisAgent.length > 0 && this.currentResult) {
      const remainingIndexes = stillOnThisAgent.map(s => s.index);
      
      const result = await this.routePlannerService.assignShipments(
        this.currentResult,
        event.toAgent,
        remainingIndexes,
        options
      );
      
      if (result.success && result.result) {
        this.currentResult = result.result;
        this.addLog(`Move Shipments`, true, `${remainingIndexes.length} shipment(s) moved to Agent ${event.toAgent}`);
      } else {
        this.addLog(`Move Shipments`, false, result.message);
      }
    } else if (shipmentIndexes.length > 0 && stillOnThisAgent.length === 0) {
      this.addLog(`Move Shipments`, false, `Shipments already moved by reoptimization`);
    }
    
    this.updateAgentInfo();
    this.isLoading = false;
  }

  // ============ REMOVE OPERATIONS ============

  async removeSelectedFromAgent(agentIndex: number) {
    if (!this.currentResult) return;
    
    const agent = this.agentInfoList[agentIndex];
    const selectedJobs = agent.jobs.filter(j => j.selected);
    const selectedShipments = agent.shipments.filter(s => s.selected);
    
    if (selectedJobs.length === 0 && selectedShipments.length === 0) {
      this.addLog('Remove Selected', false, 'No items selected');
      return;
    }
    
    this.isLoading = true;
    const options = { strategy: this.selectedRemoveStrategy };
    
    if (selectedJobs.length > 0) {
      const jobIndexes = selectedJobs.map(j => j.index);
      const result = await this.routePlannerService.removeJobs(this.currentResult, jobIndexes, options);
      this.handleOperationResult(result, `Remove ${selectedJobs.length} job(s)`);
    }
    
    if (selectedShipments.length > 0 && this.currentResult) {
      const shipmentIndexes = selectedShipments.map(s => s.index);
      const result = await this.routePlannerService.removeShipments(this.currentResult, shipmentIndexes, options);
      this.handleOperationResult(result, `Remove ${selectedShipments.length} shipment(s)`);
    }
    
    this.isLoading = false;
  }

  // ============ ADD OPERATIONS ============

  openAddJobModal(agentIndex: number) {
    this.activeAgentForAdd = agentIndex;
    this.showAddJobModal = true;
  }

  openAddShipmentModal(agentIndex: number) {
    this.activeAgentForAdd = agentIndex;
    this.showAddShipmentModal = true;
  }

  openAddJobModalAtLocation(location: { lon: number; lat: number }) {
    if (!this.currentResult || this.agentInfoList.length === 0) return;
    
    this.mapClickCoordinates = location;
    this.activeAgentForAdd = 0;  // Default to first agent
    this.showAddJobModal = true;
  }

  openAddShipmentModalAtLocation(location: { lon: number; lat: number }) {
    if (!this.currentResult || this.agentInfoList.length === 0) return;
    
    this.mapClickCoordinates = location;
    this.activeAgentForAdd = 0;  // Default to first agent
    this.showAddShipmentModal = true;
  }

  openAssignJobModal(jobIndex: number) {
    console.log('openAssignJobModal called with index:', jobIndex);
    if (!this.currentResult) return;
    this.jobIndexToAssign = jobIndex;
    this.showAssignJobModal = true;
  }

  openAssignShipmentModal(shipmentIndex: number) {
    console.log('openAssignShipmentModal called with index:', shipmentIndex);
    if (!this.currentResult) return;
    this.shipmentIndexToAssign = shipmentIndex;
    this.showAssignShipmentModal = true;
  }

  closeModals() {
    this.showAddJobModal = false;
    this.showAddShipmentModal = false;
    this.showAssignJobModal = false;
    this.showAssignShipmentModal = false;
    this.activeAgentForAdd = null;
    this.mapClickCoordinates = null;
    this.jobIndexToAssign = null;
    this.shipmentIndexToAssign = null;
  }

  async addJobFromModal(event: { jobData: AddJobData; options: JobModalOptions }) {
    if (!this.currentResult) return;
    
    this.isLoading = true;
    const { jobData, options } = event;
    
    const result = await this.routePlannerService.addNewJob(
      this.currentResult,
      jobData.agentIndex,
      {
        id: jobData.id,
        lon: jobData.lon,
        lat: jobData.lat,
        pickupAmount: jobData.pickupAmount,
        deliveryAmount: jobData.deliveryAmount,
        requirements: jobData.requirements ? jobData.requirements.split(',').map(r => r.trim()) : [],
        timeWindowStart: jobData.timeWindowStart,
        timeWindowEnd: jobData.timeWindowEnd
      },
      {
        strategy: options.strategy,
        appendToEnd: options.appendToEnd,
        beforeWaypointIndex: options.beforeWaypointIndex ?? undefined,
        afterWaypointIndex: options.afterWaypointIndex ?? undefined,
        beforeId: options.beforeId,
        afterId: options.afterId,
        priority: options.priority ?? undefined,
        allowViolations: options.allowViolations
      }
    );

    this.handleOperationResult(result, 'Add Job');
    this.isLoading = false;
    this.closeModals();
  }

  async addShipmentFromModal(event: { shipmentData: AddShipmentData; options: ShipmentModalOptions }) {
    if (!this.currentResult) return;
    
    this.isLoading = true;
    const { shipmentData, options } = event;
    
    const newShipment = this.routePlannerService.createSampleShipment(
      shipmentData.id,
      shipmentData.pickupLon,
      shipmentData.pickupLat,
      shipmentData.deliveryLon,
      shipmentData.deliveryLat
    );

    const result = await this.routePlannerService.addNewShipments(
      this.currentResult,
      shipmentData.agentIndex,
      [newShipment],
      {
        strategy: options.strategy,
        appendToEnd: options.appendToEnd,
        beforeWaypointIndex: options.beforeWaypointIndex ?? undefined,
        afterWaypointIndex: options.afterWaypointIndex ?? undefined,
        beforeId: options.beforeId,
        afterId: options.afterId,
        priority: options.priority ?? undefined,
        allowViolations: options.allowViolations
      }
    );

    this.handleOperationResult(result, 'Add Shipment');
    this.isLoading = false;
    this.closeModals();
  }

  async assignUnassignedJob(agentIndex: number) {
    if (!this.currentResult || this.jobIndexToAssign === null) return;
    
    this.isLoading = true;
    const result = await this.routePlannerService.assignJobs(
      this.currentResult,
      agentIndex,
      [this.jobIndexToAssign],
      this.buildOptions()
    );
    
    this.handleOperationResult(result, 'Assign Job');
    this.isLoading = false;
    this.closeModals();
  }

  async assignUnassignedShipment(agentIndex: number) {
    if (!this.currentResult || this.shipmentIndexToAssign === null) return;
    
    this.isLoading = true;
    const result = await this.routePlannerService.assignShipments(
      this.currentResult,
      agentIndex,
      [this.shipmentIndexToAssign],
      this.buildOptions()
    );
    
    this.handleOperationResult(result, 'Assign Shipment');
    this.isLoading = false;
    this.closeModals();
  }

  // ============ HELPER METHODS ============

  private buildOptions(): AddAssignOptions {
    const options: AddAssignOptions = {
      strategy: this.selectedStrategy,
      allowViolations: this.allowViolations
    };
    
    if (this.appendToEnd) options.appendToEnd = true;
    if (this.beforeWaypointIndex !== null) options.beforeWaypointIndex = this.beforeWaypointIndex;
    if (this.afterWaypointIndex !== null) options.afterWaypointIndex = this.afterWaypointIndex;
    if (this.beforeId) options.beforeId = this.beforeId;
    if (this.afterId) options.afterId = this.afterId;
    if (this.priority !== null) options.priority = this.priority;
    
    return options;
  }

  getViolations(): string[] {
    return this.currentResult?.getViolations() ?? [];
  }

  clearViolations() {
    if (this.currentResult) {
      this.currentResult.getRaw().properties.violations = [];
      this.addLog('Clear Violations', true, 'All violations cleared');
    }
  }


  clearLogs() {
    this.editorLogs = [];
  }

  lightTheme() {
    this.loadCssFile('assets/styles/timeline-minimal.css');
  }
  
  darkTheme() {
    this.loadCssFile('assets/styles/timeline-dark.css');
  }

  private loadCssFile(path: string, id: string = 'theme-style') {
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

  private handleOperationResult(operationResult: EditorOperationResult, operation: string) {
    this.addLog(operation, operationResult.success, operationResult.message);
    
    if (operationResult.success && operationResult.result) {
      this.currentResult = operationResult.result;
      this.updateAgentInfo();
    }
  }

  private addLog(operation: string, success: boolean, message: string) {
    this.editorLogs.unshift({
      timestamp: new Date(),
      operation,
      success,
      message
    });
    
    if (this.editorLogs.length > 20) {
      this.editorLogs.pop();
    }
  }

  private updateAgentInfo() {
    if (!this.currentResult) return;
    
    const data = this.currentResult.getData();
    const totalAgentCount = data.inputData.agents.length;
    const agentSolutionsByIndex = this.currentResult.getAgentSolutionsByIndex();
    
    this.agentInfoList = [];
    
    for (let i = 0; i < totalAgentCount; i++) {
      const solution = agentSolutionsByIndex[i] || null;
      const agentData = data.inputData.agents[i];
      
      this.agentInfoList.push({
        index: i,
        data: agentData,
        solution: solution,
        jobs: this.getJobsForAgent(i),
        shipments: this.getShipmentsForAgent(i)
      });
    }

    // Initialize timeline
    this.initializeTimeline();
  }

  private initializeTimeline() {
    if (!this.currentResult) return;

    // Wait for the container to be available in the DOM
    setTimeout(() => {
      if (this.timelinesContainer && this.timelinesContainer.nativeElement && this.currentResult) {
        // Clear container first
        this.timelinesContainer.nativeElement.innerHTML = '';
        
        const inputData = this.currentResult.getData().inputData;
        
        // Initialize all agents as visible
        for (let i = 0; i < inputData.agents.length; i++) {
          this.agentVisibilityState.set(i, true);
        }
        
        // Define menu items for agent actions
        const agentMenuItems: TimelineMenuItem[] = [
          {
            key: 'toggle-visibility',
            label: 'Hide Route',
            callback: (agentIndex: number) => {
              this.toggleAgentVisibility(agentIndex);
            }
          }
        ];
        
        this.routePlannerTimeline = new RoutePlannerTimeline(
          this.timelinesContainer.nativeElement,
          inputData,
          this.currentResult,
          {
            timelineType: 'time',
            capacityUnit: 'kg',
            hasLargeDescription: false,
            agentLabel: 'Agent',
            showWaypointPopup: true,
            agentColors: this.agentColorService.getAllColors(),
            agentMenuItems: agentMenuItems
          }
        );
        
        // Listen for menu show event to update label dynamically
        this.routePlannerTimeline.on('beforeAgentMenuShow', (agentIndex: number, actions: TimelineMenuItem[]) => {
          return actions.map(action => {
            if (action.key === 'toggle-visibility') {
              const isVisible = this.agentVisibilityState.get(agentIndex) ?? true;
              return {
                ...action,
                label: isVisible ? 'Hide Route' : 'Show Route'
              };
            }
            return action;
          });
        });
      }
    }, 200);
  }

  private getJobsForAgent(agentIndex: number) {
    if (!this.currentResult) return [];
    
    const jobIndexes = this.currentResult.getAgentJobs(agentIndex);
    const allJobsData = this.currentResult.getRaw().properties.params.jobs;
    
    return jobIndexes.map(jobIndex => ({
      index: jobIndex,
      data: allJobsData[jobIndex],
      selected: false
    }));
  }

  private getShipmentsForAgent(agentIndex: number) {
    if (!this.currentResult) return [];
    
    const shipmentIndexes = this.currentResult.getAgentShipments(agentIndex);
    const allShipmentsData = this.currentResult.getRawData().properties.params.shipments;
    
    return shipmentIndexes.map(shipmentIndex => ({
      index: shipmentIndex,
      data: allShipmentsData[shipmentIndex],
      selected: false
    }));
  }

  getJobId(jobIndex: number | null): string {
    if (jobIndex === null || !this.currentResult) return '';
    const jobs = this.currentResult.getRawData().properties.params.jobs;
    return jobs[jobIndex]?.id || `job-${jobIndex}`;
  }

  getShipmentId(shipmentIndex: number | null): string {
    if (shipmentIndex === null || !this.currentResult) return '';
    const shipments = this.currentResult.getRawData().properties.params.shipments;
    return shipments[shipmentIndex]?.id || `shipment-${shipmentIndex}`;
  }

  toggleAgentVisibility(agentIndex: number) {
    const currentState = this.agentVisibilityState.get(agentIndex) ?? true;
    const newState = !currentState;
    this.agentVisibilityState.set(agentIndex, newState);
    
    if (this.routeMapComponent) {
      this.routeMapComponent.setAgentVisibility(agentIndex, newState);
    }
    
    this.updateTimelineVisualState(agentIndex, newState);
  }

  private updateTimelineVisualState(agentIndex: number, visible: boolean) {
    const timelineElement = document.querySelector(`.agent-${agentIndex} .geoapify-rp-sdk-timeline`);
    if (timelineElement) {
      if (visible) {
        (timelineElement as HTMLElement).style.filter = '';
      } else {
        (timelineElement as HTMLElement).style.filter = 'grayscale(0.6)';
      }
    }
  }
}

