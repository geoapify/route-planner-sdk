import { AgentPlan } from "@sdk/models";
import { DemoModifyContext } from "./agentModifyDialog";

type WaypointOption = { index: number; label: string };

const buildWaypointOptions = (agentPlan: AgentPlan): WaypointOption[] => {
  const waypoints = agentPlan.getWaypoints();
  return waypoints.map((waypoint, index) => {
    const actions = waypoint.getActions();
    const actionTypes = actions.map(action => action.getType()).join(", ");
    const jobIndexes = actions.map(action => action.getJobIndex()).filter(i => i !== undefined);
    const shipmentIndexes = actions.map(action => action.getShipmentIndex()).filter(i => i !== undefined);
    
    let label = `#${index} - ${actionTypes}`;
    if (jobIndexes.length) label += ` (Job #${jobIndexes.join(", #")})`;
    if (shipmentIndexes.length) label += ` (Shipment #${shipmentIndexes.join(", #")})`;
    
    return { index, label };
  });
};

const createWaypointSelect = (options: WaypointOption[]): HTMLSelectElement => {
  const select = document.createElement("select");
  select.className = "modify-select";
  options.forEach(waypointOption => {
    const option = document.createElement("option");
    option.value = String(waypointOption.index);
    option.textContent = waypointOption.label;
    select.appendChild(option);
  });
  return select;
};

const updateModifiedResult = (context: DemoModifyContext): void => {
  const modifiedResult = context.editor.getModifiedResult();
  context.onResult(modifiedResult);
};

const buildMoveWaypointSection = (
  context: DemoModifyContext,
  waypointOptions: WaypointOption[],
  makeButton: (label: string, onClick: () => Promise<void>, disabled?: boolean) => HTMLButtonElement,
  createField: (labelText: string, element: HTMLElement) => HTMLElement
): HTMLElement => {
  const section = document.createElement("div");
  section.className = "modify-section";

  const title = document.createElement("div");
  title.className = "modify-section__title";
  title.textContent = "Move Waypoint";
  section.appendChild(title);

  const fromSelect = createWaypointSelect(waypointOptions);
  const toSelect = createWaypointSelect(waypointOptions);

  const button = makeButton("Move waypoint", async () => {
    const fromIndex = Number(fromSelect.value);
    const toIndex = Number(toSelect.value);
    if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;
    await context.editor.moveWaypoint(context.agentIndex, fromIndex, toIndex);
    updateModifiedResult(context);
  }, waypointOptions.length < 2);

  section.appendChild(createField("From", fromSelect));
  section.appendChild(createField("To", toSelect));
  const row = document.createElement("div");
  row.className = "modify-row";
  row.appendChild(button);
  section.appendChild(row);

  return section;
};

const buildReoptimizeSection = (
  context: DemoModifyContext,
  makeButton: (label: string, onClick: () => Promise<void>, disabled?: boolean) => HTMLButtonElement,
  createField: (labelText: string, element: HTMLElement) => HTMLElement
): HTMLElement => {
  const section = document.createElement("div");
  section.className = "modify-section";

  const title = document.createElement("div");
  title.className = "modify-section__title";
  title.textContent = "Reoptimize Agent Plan";
  section.appendChild(title);

  const includeUnassignedToggle = document.createElement("label");
  includeUnassignedToggle.className = "modify-toggle";
  const includeUnassignedInput = document.createElement("input");
  includeUnassignedInput.type = "checkbox";
  includeUnassignedToggle.appendChild(includeUnassignedInput);
  includeUnassignedToggle.appendChild(document.createTextNode("Include unassigned"));

  const allowViolationsToggle = document.createElement("label");
  allowViolationsToggle.className = "modify-toggle";
  const allowViolationsInput = document.createElement("input");
  allowViolationsInput.type = "checkbox";
  allowViolationsToggle.appendChild(allowViolationsInput);
  allowViolationsToggle.appendChild(document.createTextNode("Allow violations"));

  const button = makeButton("Reoptimize plan", async () => {
    const options: any = { agentIdOrIndex: context.agentIndex };
    if (includeUnassignedInput.checked) options.includeUnassigned = true;
    if (allowViolationsInput.checked) options.allowViolations = true;
    
    await context.editor.reoptimizeAgentPlan(options);
    updateModifiedResult(context);
  });

  section.appendChild(includeUnassignedToggle);
  section.appendChild(allowViolationsToggle);
  const row = document.createElement("div");
  row.className = "modify-row";
  row.appendChild(button);
  section.appendChild(row);

  return section;
};

const buildTimeOffsetSection = (
  context: DemoModifyContext,
  waypointOptions: WaypointOption[],
  makeButton: (label: string, onClick: () => Promise<void>, disabled?: boolean) => HTMLButtonElement,
  createField: (labelText: string, element: HTMLElement) => HTMLElement,
  readNumberValue: (input: HTMLInputElement) => number | undefined
): HTMLElement => {
  const section = document.createElement("div");
  section.className = "modify-section";

  const title = document.createElement("div");
  title.className = "modify-section__title";
  title.textContent = "Add Time Offset";
  section.appendChild(title);

  const waypointSelect = createWaypointSelect(waypointOptions);
  
  const offsetInput = document.createElement("input");
  offsetInput.type = "number";
  offsetInput.placeholder = "seconds (e.g., 300)";

  const button = makeButton("Add time offset", async () => {
    const waypointIndex = Number(waypointSelect.value);
    const offsetSeconds = readNumberValue(offsetInput);
    
    if (Number.isNaN(waypointIndex) || offsetSeconds === undefined) return;
    
    context.editor.addTimeOffsetAfterWaypoint(context.agentIndex, waypointIndex, offsetSeconds);
    updateModifiedResult(context);
  });

  section.appendChild(createField("After waypoint", waypointSelect));
  section.appendChild(createField("Offset (seconds)", offsetInput));
  const row = document.createElement("div");
  row.className = "modify-row";
  row.appendChild(button);
  section.appendChild(row);

  return section;
};

export const buildAdvancedTabContent = (
  context: DemoModifyContext,
  makeButton: (label: string, onClick: () => Promise<void>, disabled?: boolean) => HTMLButtonElement,
  createField: (labelText: string, element: HTMLElement) => HTMLElement,
  readNumberValue: (input: HTMLInputElement) => number | undefined
): HTMLElement => {
  const content = document.createElement("div");
  content.className = "modify-tab-content";
  content.style.display = "none";

  const agentPlan = context.result.getAgentPlans()[context.agentIndex];
  if (!agentPlan) {
    const empty = document.createElement("div");
    empty.className = "modify-empty";
    empty.textContent = "No waypoints available for this agent.";
    content.appendChild(empty);
    return content;
  }

  const waypointOptions = buildWaypointOptions(agentPlan);

  content.appendChild(buildMoveWaypointSection(context, waypointOptions, makeButton, createField));
  content.appendChild(buildReoptimizeSection(context, makeButton, createField));
  content.appendChild(buildTimeOffsetSection(context, waypointOptions, makeButton, createField, readNumberValue));

  return content;
};
