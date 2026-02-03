import { PRESERVE_ORDER, REOPTIMIZE } from "@sdk/index";
import { AgentPlan, RoutePlannerResult } from "@sdk/models";
import { getAgentColor } from "../../core/agentColors";
import { buildAdvancedTabContent } from "./agentAdvancedTab";

export type DemoModifyContext = {
  agentIndex: number;
  result: RoutePlannerResult;
  editor: any;
  onResult: (result: any) => void;
};

type DemoItemOption = {
  index: number;
  label: string;
  color: string;
  agentIndex?: number;
  assigned: boolean;
};

type DemoItemGroup = {
  label: string;
  options: DemoItemOption[];
};

const formatAgentLabel = (agentIndex: number, agentId?: string) =>
  agentId || `agent-${agentIndex + 1}`;

const formatJobLabel = (job: any, index: number) =>
  job?.id ? String(job.id) : `#${index}`;

const formatShipmentLabel = (shipment: any, index: number) =>
  shipment?.id ? String(shipment.id) : `#${index}`;

const formatWaypointList = (waypoints: number[]) =>
  waypoints.map((value) => value + 1).join(", ");

const getJobWaypointInfo = (agentPlan: AgentPlan, jobIndex: number) => {
  const waypoints = agentPlan
    .getActions()
    .filter((action) => action.getJobIndex?.() === jobIndex)
    .map((action) => action.getWaypointIndex?.())
    .filter((value): value is number => value !== undefined);

  const unique = Array.from(new Set(waypoints)).sort((a, b) => a - b);
  if (!unique.length) return "";
  return `wp ${formatWaypointList(unique)}`;
};

const getShipmentWaypointInfo = (agentPlan: AgentPlan, shipmentIndex: number) => {
  const actions = agentPlan
    .getActions()
    .filter((action) => action.getShipmentIndex?.() === shipmentIndex);

  const pickups: number[] = [];
  const deliveries: number[] = [];
  const other: number[] = [];

  actions.forEach((action) => {
    const waypoint = action.getWaypointIndex?.();
    if (waypoint === undefined) return;
    const type = (action.getType?.() || "").toLowerCase();
    if (type === "pickup") {
      pickups.push(waypoint);
    } else if (type === "delivery") {
      deliveries.push(waypoint);
    } else {
      other.push(waypoint);
    }
  });

  const parts: string[] = [];
  if (pickups.length) {
    parts.push(`pickup wp ${formatWaypointList(Array.from(new Set(pickups)).sort((a, b) => a - b))}`);
  }
  if (deliveries.length) {
    parts.push(
      `delivery wp ${formatWaypointList(Array.from(new Set(deliveries)).sort((a, b) => a - b))}`
    );
  }
  if (!parts.length && other.length) {
    parts.push(`wp ${formatWaypointList(Array.from(new Set(other)).sort((a, b) => a - b))}`);
  }

  return parts.join(" | ");
};

const buildItemGroups = (
  result: RoutePlannerResult,
  type: "job" | "shipment"
): DemoItemGroup[] => {
  const input = result.getRoutingOptions() as any;
  const items: any[] = type === "job" ? input?.jobs || [] : input?.shipments || [];
  const agentPlans = result.getAgentPlans();
  const groups = new Map<number, DemoItemGroup>();
  const unassigned: DemoItemGroup = {
    label: "Unassigned",
    options: []
  };

  items.forEach((item, index) => {
    const plan =
      type === "job" ? result.getJobPlan(index) : result.getShipmentPlan(index);
    const agentIndex = plan?.getAgentIndex();
    const agentPlan = plan?.getAgentPlan();
    const agentLabel =
      agentIndex !== undefined
        ? formatAgentLabel(agentIndex, agentPlan?.getAgentId?.())
        : "unassigned";
    const waypointInfo =
      agentPlan && agentIndex !== undefined
        ? type === "job"
          ? getJobWaypointInfo(agentPlan, index)
          : getShipmentWaypointInfo(agentPlan, index)
        : "";
    const baseLabel =
      type === "job" ? formatJobLabel(item, index) : formatShipmentLabel(item, index);
    const labelParts = [
      `${type === "job" ? "Job" : "Shipment"} ${baseLabel}`,
      agentLabel
    ];
    if (waypointInfo) {
      labelParts.push(waypointInfo);
    }

    const option: DemoItemOption = {
      index,
      label: labelParts.join(" | "),
      color: agentIndex !== undefined ? getAgentColor(agentIndex) : "#777",
      agentIndex,
      assigned: agentIndex !== undefined
    };

    if (agentIndex === undefined) {
      unassigned.options.push(option);
      return;
    }

    const agentGroup =
      groups.get(agentIndex) ||
      {
        label: formatAgentLabel(agentIndex, agentPlan?.getAgentId?.()),
        options: []
      };
    agentGroup.options.push(option);
    groups.set(agentIndex, agentGroup);
  });

  const orderedGroups: DemoItemGroup[] = [];
  for (let index = 0; index < agentPlans.length; index += 1) {
    const group = groups.get(index);
    if (group && group.options.length) {
      orderedGroups.push(group);
    }
  }
  if (unassigned.options.length) {
    orderedGroups.push(unassigned);
  }

  return orderedGroups;
};

const createGroupedSelect = (groups: DemoItemGroup[]) => {
  const select = document.createElement("select");
  select.className = "modify-select";
  groups.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    group.options.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = String(option.index);
      optionEl.textContent = option.label;
      optionEl.style.color = option.color;
      if (option.agentIndex !== undefined) {
        optionEl.dataset.agentIndex = String(option.agentIndex);
      }
      if (!option.assigned) {
        optionEl.dataset.unassigned = "true";
      }
      optgroup.appendChild(optionEl);
    });
    select.appendChild(optgroup);
  });
  return select;
};

const createField = (labelText: string, element: HTMLElement) => {
  const field = document.createElement("div");
  field.className = "modify-field";
  const label = document.createElement("label");
  label.textContent = labelText;
  field.appendChild(label);
  field.appendChild(element);
  return field;
};

const readNumberValue = (input: HTMLInputElement) => {
  const trimmed = input.value.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
};

export function createModifyPanel(context: DemoModifyContext) {
  const panel = document.createElement("div");
  panel.className = "modify-panel";

  const title = document.createElement("div");
  title.className = "modify-panel__title";
  title.textContent = "Modify plan";
  panel.appendChild(title);

  const makeButton = (
    label: string,
    onClick: () => Promise<void>,
    disabled = false
  ) => {
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await onClick();
      } finally {
        button.disabled = false;
      }
    });
    return button;
  };

  const tabs = document.createElement("div");
  tabs.className = "modify-tabs";

  const removeTab = document.createElement("button");
  removeTab.className =
    "button button--ghost modify-tab modify-tab--remove modify-tab--active";
  removeTab.type = "button";
  removeTab.textContent = "Remove";
  removeTab.setAttribute("aria-pressed", "true");

  const assignTab = document.createElement("button");
  assignTab.className =
    "button button--ghost modify-tab modify-tab--assign";
  assignTab.type = "button";
  assignTab.textContent = "Assign";
  assignTab.setAttribute("aria-pressed", "false");

  const advancedTab = document.createElement("button");
  advancedTab.className =
    "button button--ghost modify-tab modify-tab--advanced";
  advancedTab.type = "button";
  advancedTab.textContent = "Advanced";
  advancedTab.setAttribute("aria-pressed", "false");

  tabs.appendChild(removeTab);
  tabs.appendChild(assignTab);
  tabs.appendChild(advancedTab);
  panel.appendChild(tabs);

  const removeContent = document.createElement("div");
  removeContent.className = "modify-tab-content";

  const assignContent = document.createElement("div");
  assignContent.className = "modify-tab-content";
  assignContent.style.display = "none";

  const jobGroups = buildItemGroups(context.result, "job");
  const shipmentGroups = buildItemGroups(context.result, "shipment");

  const buildRemoveSection = (label: string, groups: DemoItemGroup[], onRemove: (index: number, strategy: string) => Promise<void>) => {
    const section = document.createElement("div");
    section.className = "modify-section";

    const header = document.createElement("div");
    header.className = "modify-section__title";
    header.textContent = label;
    section.appendChild(header);

    const select = createGroupedSelect(groups);
    const strategySelect = document.createElement("select");
    strategySelect.className = "modify-select";
    strategySelect.innerHTML = `
      <option value="${REOPTIMIZE}">reoptimize</option>
      <option value="${PRESERVE_ORDER}">preserveOrder</option>
    `;

    const actionRow = document.createElement("div");
    actionRow.className = "modify-row";
    const removeButton = makeButton(`Remove ${label.toLowerCase()}`, async () => {
      const selectedIndex = Number(select.value);
      if (Number.isNaN(selectedIndex)) return;
      await onRemove(selectedIndex, strategySelect.value);
      context.onResult(context.editor.getModifiedResult());
    });
    actionRow.appendChild(removeButton);

    section.appendChild(createField("Item", select));
    section.appendChild(createField("Strategy", strategySelect));
    section.appendChild(actionRow);

    if (!groups.length) {
      removeButton.disabled = true;
      select.disabled = true;
      strategySelect.disabled = true;
    }

    return section;
  };

  const buildAssignSection = (
    label: string,
    groups: DemoItemGroup[],
    onAssign: (index: number, agentIndex: number, options: any) => Promise<void>
  ) => {
    if (!groups.length) return null;

    const section = document.createElement("div");
    section.className = "modify-section";

    const header = document.createElement("div");
    header.className = "modify-section__title";
    header.textContent = label;
    section.appendChild(header);

    const select = createGroupedSelect(groups);
    const strategySelect = document.createElement("select");
    strategySelect.className = "modify-select";
    strategySelect.innerHTML = `
      <option value="${REOPTIMIZE}">reoptimize</option>
      <option value="${PRESERVE_ORDER}">preserveOrder</option>
    `;

    const removeStrategySelect = document.createElement("select");
    removeStrategySelect.className = "modify-select";
    removeStrategySelect.innerHTML = `
      <option value="${PRESERVE_ORDER}">remove: preserveOrder</option>
      <option value="${REOPTIMIZE}">remove: reoptimize</option>
    `;

    const beforeWaypointInput = document.createElement("input");
    beforeWaypointInput.type = "number";
    beforeWaypointInput.placeholder = "e.g. 2";

    const afterWaypointInput = document.createElement("input");
    afterWaypointInput.type = "number";
    afterWaypointInput.placeholder = "e.g. 1";

    const afterIdInput = document.createElement("input");
    afterIdInput.type = "text";
    afterIdInput.placeholder = "job/shipment id";

    const appendToggle = document.createElement("label");
    appendToggle.className = "modify-toggle";
    const appendInput = document.createElement("input");
    appendInput.type = "checkbox";
    appendToggle.appendChild(appendInput);
    appendToggle.appendChild(document.createTextNode("Append to end"));

    const priorityInput = document.createElement("input");
    priorityInput.type = "number";
    priorityInput.placeholder = "priority";

    const optionsGrid = document.createElement("div");
    optionsGrid.className = "modify-grid";
    optionsGrid.appendChild(createField("Strategy", strategySelect));
    optionsGrid.appendChild(createField("Remove strategy", removeStrategySelect));
    optionsGrid.appendChild(createField("Before waypoint", beforeWaypointInput));
    optionsGrid.appendChild(createField("After waypoint", afterWaypointInput));
    optionsGrid.appendChild(createField("After id", afterIdInput));
    optionsGrid.appendChild(createField("Priority", priorityInput));
    optionsGrid.appendChild(appendToggle);

    const actionRow = document.createElement("div");
    actionRow.className = "modify-row";
    const assignButton = makeButton(`Assign ${label.toLowerCase()}`, async () => {
      const selectedIndex = Number(select.value);
      if (Number.isNaN(selectedIndex)) return;

      const options: any = {
        strategy: strategySelect.value,
        removeStrategy: removeStrategySelect.value
      };

      const afterWaypointIndex = readNumberValue(afterWaypointInput);
      const priority = readNumberValue(priorityInput);
      const afterId = afterIdInput.value.trim();

      if (afterWaypointIndex !== undefined) {
        options.afterWaypointIndex = afterWaypointIndex;
      }
      if (afterId) {
        options.afterId = afterId;
      }
      if (appendInput.checked) {
        options.append = true;
      }
      if (priority !== undefined) {
        options.priority = priority;
      }

      await onAssign(selectedIndex, context.agentIndex, options);
      context.onResult(context.editor.getModifiedResult());
    });
    actionRow.appendChild(assignButton);

    const updateAssignDisabled = () => {
      const selectedOption = select.options[select.selectedIndex];
      const assignedAgent = selectedOption?.dataset.agentIndex;
      assignButton.disabled =
        !select.options.length ||
        (assignedAgent !== undefined &&
          Number(assignedAgent) === Number(context.agentIndex));
    };
    select.addEventListener("change", updateAssignDisabled);
    updateAssignDisabled();

    section.appendChild(createField("Item", select));
    section.appendChild(optionsGrid);
    section.appendChild(actionRow);

    return section;
  };

  if (jobGroups.length) {
    removeContent.appendChild(
      buildRemoveSection("Job", jobGroups, async (index, strategy) => {
        await context.editor.removeJobs([index], { strategy });
      })
    );
  }

  if (shipmentGroups.length) {
    removeContent.appendChild(
      buildRemoveSection("Shipment", shipmentGroups, async (index, strategy) => {
        await context.editor.removeShipments([index], { strategy });
      })
    );
  }

  const assignJobSection = buildAssignSection(
    "Job",
    jobGroups,
    async (index, agentIndex, options) => {
      await context.editor.assignJobs(agentIndex, [index], options);
    }
  );
  if (assignJobSection) {
    assignContent.appendChild(assignJobSection);
  }

  const assignShipmentSection = buildAssignSection(
    "Shipment",
    shipmentGroups,
    async (index, agentIndex, options) => {
      await context.editor.assignShipments(agentIndex, [index], options);
    }
  );
  if (assignShipmentSection) {
    assignContent.appendChild(assignShipmentSection);
  }

  if (!jobGroups.length && !shipmentGroups.length) {
    const empty = document.createElement("div");
    empty.className = "modify-empty";
    empty.textContent = "No jobs or shipments available.";
    removeContent.appendChild(empty);
    assignContent.appendChild(empty.cloneNode(true));
  }

  const advancedContent = buildAdvancedTabContent(context, makeButton, createField, readNumberValue);

  const setTab = (tab: "remove" | "assign" | "advanced") => {
    const isRemove = tab === "remove";
    const isAssign = tab === "assign";
    const isAdvanced = tab === "advanced";
    
    removeTab.classList.toggle("modify-tab--active", isRemove);
    assignTab.classList.toggle("modify-tab--active", isAssign);
    advancedTab.classList.toggle("modify-tab--active", isAdvanced);
    
    removeTab.setAttribute("aria-pressed", String(isRemove));
    assignTab.setAttribute("aria-pressed", String(isAssign));
    advancedTab.setAttribute("aria-pressed", String(isAdvanced));
    
    removeContent.style.display = isRemove ? "grid" : "none";
    assignContent.style.display = isAssign ? "grid" : "none";
    advancedContent.style.display = isAdvanced ? "grid" : "none";
  };

  removeTab.addEventListener("click", () => setTab("remove"));
  assignTab.addEventListener("click", () => setTab("assign"));
  advancedTab.addEventListener("click", () => setTab("advanced"));

  panel.appendChild(removeContent);
  panel.appendChild(assignContent);
  panel.appendChild(advancedContent);

  return panel;
}
