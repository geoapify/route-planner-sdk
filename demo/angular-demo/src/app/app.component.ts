import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { EditorOperationResult, RoutePlannerService } from "../services/route-planner.service";
import { 
  RoutePlannerTimeline, 
  RoutePlannerResult,
  AddAssignStrategy,
  RemoveStrategy,
  Job
} from "../../../../src";

import { AgentInfo, EditorLog } from "./models/demo.types";
import { AgentCardComponent } from "./components/agent-card/agent-card.component";
import { ViolationsDisplayComponent } from "./components/violations-display/violations-display.component";
import { IssuesDisplayComponent } from "./components/issues-display/issues-display.component";
import { OperationLogsComponent } from "./components/operation-logs/operation-logs.component";
import { GlobalSettingsComponent } from "./components/global-settings/global-settings.component";

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
    GlobalSettingsComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild("timelinesContainer") timelinesContainer!: ElementRef;

  currentResult: RoutePlannerResult | undefined;
  routePlannerTimeline: RoutePlannerTimeline | undefined;
  agentInfoList: AgentInfo[] = [];
  editorLogs: EditorLog[] = [];
  isLoading = false;

  // Global Settings
  selectedStrategy: AddAssignStrategy = 'reoptimize';
  selectedRemoveStrategy: RemoveStrategy = 'reoptimize';
  insertAfterId = '';
  insertBeforeId = '';
  insertAtIndex: number | null = null;
  allowViolations = true;

  // Add job/shipment modal state
  showAddJobModal = false;
  showAddShipmentModal = false;
  activeAgentForAdd: number | null = null;

  // New job form
  newJobId = 'new_job_1';
  newJobLon = 44.805;
  newJobLat = 41.695;
  newJobPickupAmount = 0;
  newJobDeliveryAmount = 100;
  newJobRequirements = '';
  newJobTimeWindowStart: number | null = null;
  newJobTimeWindowEnd: number | null = null;

  // New shipment form
  newShipmentId = 'new_order_1';
  newPickupLon = 44.802171;
  newPickupLat = 41.6928772;
  newDeliveryLon = 44.805;
  newDeliveryLat = 41.695;

  constructor(private routePlannerService: RoutePlannerService) {}

  // ============ SCENARIO GENERATION ============

  async generateAndSolveTask() {
    this.isLoading = true;
    const rawData = '{"mode":"drive","agents":[{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]},{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]},{"start_location":[44.820383188672054,41.69446069999999],"time_windows":[[0,7200]]}],"shipments":[{"id":"order_1","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80223587256097,41.692045],"duration":120}},{"id":"order_2","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_3","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_4","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80429263046858,41.69458485],"duration":120}},{"id":"order_5","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.81217323729341,41.694093300461546],"duration":120}},{"id":"order_6","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80284948206578,41.6939907],"duration":120}},{"id":"order_7","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79882656136182,41.69205345],"duration":120}},{"id":"order_8","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.80086951415857,41.69484995],"duration":120}},{"id":"order_9","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.82100349999999,41.69336120046147],"duration":120}},{"id":"order_10","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79823826245833,41.69299355],"duration":120}},{"id":"order_11","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79875455107554,41.69260845],"duration":120}},{"id":"order_12","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_13","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_14","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79957989088356,41.692849250461435],"duration":120}},{"id":"order_15","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79752501990028,41.69344205],"duration":120}},{"id":"order_16","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79752501990028,41.69344205],"duration":120}},{"id":"order_17","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_18","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_19","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.800588665956674,41.692680499999994],"duration":120}},{"id":"order_20","pickup":{"location_index":0,"duration":120},"delivery":{"location":[44.79968626304391,41.69151135],"duration":120}}],"locations":[{"id":"warehouse-0","location":[44.802171,41.6928772]}]}';
    
    const result = await this.routePlannerService.planRoute(JSON.parse(rawData));
    
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
      .setLocation(44.805, 41.695)
      .addRequirement('refrigerated')
      .setDeliveryAmount(100);
    
    await this.addJobAndShowResult(job, 'Missing Capability Test', 0);
  }

  async testCapacityExceeded() {
    const job = new Job()
      .setId(`test-heavy-${Date.now()}`)
      .setLocation(44.805, 41.695)
      .setDeliveryAmount(600);
    
    await this.addJobAndShowResult(job, 'Capacity Exceeded Test', 0);
  }

  async testTimeWindowViolation() {
    const job = new Job()
      .setId(`test-evening-${Date.now()}`)
      .setLocation(44.805, 41.695)
      .addTimeWindow(64800, 72000)
      .setDeliveryAmount(50);
    
    await this.addJobAndShowResult(job, 'Time Window Violation Test', 0);
  }

  async testBreakViolation() {
    const job = new Job()
      .setId(`test-lunch-${Date.now()}`)
      .setLocation(44.805, 41.695)
      .addTimeWindow(43800, 45900)
      .setDeliveryAmount(50);
    
    await this.addJobAndShowResult(job, 'Break Violation Test', 1);
  }

  async testMultipleViolations() {
    const job = new Job()
      .setId(`test-multi-${Date.now()}`)
      .setLocation(44.805, 41.695)
      .addRequirement('refrigerated')
      .addRequirement('hazmat')
      .addTimeWindow(64800, 72000)
      .setDeliveryAmount(600);
    
    await this.addJobAndShowResult(job, 'Multiple Violations Test', 0);
  }

  private async addJobAndShowResult(job: Job, testName: string, agentIndex: number) {
    if (!this.currentResult) return;
    
    this.isLoading = true;
    const result = await this.routePlannerService.addNewJobs(
      this.currentResult,
      agentIndex,
      [job],
      { strategy: this.selectedStrategy, allowViolations: this.allowViolations }
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
    const options = { strategy: this.selectedStrategy, allowViolations: this.allowViolations };
    
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

  closeModals() {
    this.showAddJobModal = false;
    this.showAddShipmentModal = false;
    this.activeAgentForAdd = null;
  }

  async addJobFromModal() {
    if (!this.currentResult || this.activeAgentForAdd === null) return;
    
    this.isLoading = true;
    const result = await this.routePlannerService.addNewJob(
      this.currentResult,
      this.activeAgentForAdd,
      {
        id: this.newJobId,
        lon: this.newJobLon,
        lat: this.newJobLat,
        pickupAmount: this.newJobPickupAmount,
        deliveryAmount: this.newJobDeliveryAmount,
        requirements: this.newJobRequirements ? this.newJobRequirements.split(',').map(r => r.trim()) : [],
        timeWindowStart: this.newJobTimeWindowStart,
        timeWindowEnd: this.newJobTimeWindowEnd
      },
      { strategy: this.selectedStrategy, allowViolations: this.allowViolations }
    );

    this.handleOperationResult(result, 'Add Job');
    const idNum = parseInt(this.newJobId.replace('new_job_', '')) || 0;
    this.newJobId = `new_job_${idNum + 1}`;
    
    this.isLoading = false;
    this.closeModals();
  }

  async addShipmentFromModal() {
    if (!this.currentResult || this.activeAgentForAdd === null) return;
    
    this.isLoading = true;
    const newShipment = this.routePlannerService.createSampleShipment(
      this.newShipmentId,
      this.newPickupLon,
      this.newPickupLat,
      this.newDeliveryLon,
      this.newDeliveryLat
    );

    const result = await this.routePlannerService.addNewShipments(
      this.currentResult,
      this.activeAgentForAdd,
      [newShipment],
      { strategy: this.selectedStrategy, allowViolations: this.allowViolations }
    );

    this.handleOperationResult(result, 'Add Shipment');
    const idNum = parseInt(this.newShipmentId.replace('new_order_', '')) || 0;
    this.newShipmentId = `new_order_${idNum + 1}`;
    
    this.isLoading = false;
    this.closeModals();
  }

  // ============ HELPER METHODS ============

  getViolations(): string[] {
    return this.currentResult?.getViolations() ?? [];
  }

  clearViolations() {
    if (this.currentResult) {
      this.currentResult.getRawData().properties.violations = [];
      this.addLog('Clear Violations', true, 'All violations cleared');
    }
  }


  clearLogs() {
    this.editorLogs = [];
  }

  getAgentDisplayName(agent: AgentInfo): string {
    return agent.data.id || `Agent ${agent.index}`;
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
  }

  private getJobsForAgent(agentIndex: number) {
    if (!this.currentResult) return [];
    
    const jobIndexes = this.currentResult.getAgentJobs(agentIndex);
    const allJobsData = this.currentResult.getRawData().properties.params.jobs;
    
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
}

