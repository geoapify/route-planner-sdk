import { createModifyPanel } from "./agentModifyDialog";
import type { DemoRoutePlannerState } from "../../core/store";
import { AgentPlan, RoutePlannerResult } from "@sdk/models";
import { getAgentColor } from "../../core/agentColors";

const formatDistance = (meters?: number) => {
  if (!meters && meters !== 0) return "--";
  if (meters > 10000) return `${(meters / 1000).toFixed(1)} km`;
  if (meters > 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds?: number) => {
  if (!seconds && seconds !== 0) return "--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

const buildStats = (agentPlan: AgentPlan, result: RoutePlannerResult) => {
  const agent = agentPlan.getAgentInputData();
  const actions = agentPlan.getActions();
  const jobIndexes = agentPlan.getPlannedJobs();
  const shipmentIndexes = agentPlan.getPlannedShipments();

  let pickupUsed = 0;
  let deliveryUsed = 0;

  jobIndexes.forEach((jobIndex: number) => {
    const jobPlan = result.getJobPlan(jobIndex);
    pickupUsed += jobPlan?.getJobInputData().pickup_amount || 0;
    deliveryUsed += jobPlan?.getJobInputData().delivery_amount || 0;
  });

  shipmentIndexes.forEach((shipmentIndex) => {
    const shipmentPlan = result.getShipmentPlan(shipmentIndex);
    deliveryUsed += shipmentPlan.getShipmentInputData().amount || 0;
  });

  const stopCount = actions.filter((action) => {
    const type = action.getType();
    return type !== "start" && type !== "end";
  }).length;

  return {
    stopCount,
    jobCount: jobIndexes.length,
    shipmentCount: shipmentIndexes.length,
    pickupUsed,
    deliveryUsed,
    pickupCap: agent?.pickup_capacity,
    deliveryCap: agent?.delivery_capacity
  };
};

export function createAgentsPanel(
  container: HTMLElement,
  metaEl: HTMLElement,
  issuesEl: HTMLElement,
  store: { subscribe: (listener: (state: DemoRoutePlannerState) => void) => void },
  onFocusAgent: (agentIndex: number) => void,
  onToggleAgent: (agentIndex: number, hidden: boolean) => void,
  onUpdateResult: (result: any) => void
) {
  store.subscribe((state) => {
    const result: RoutePlannerResult = state.result;
    container.innerHTML = "";

    if (!result) {
      container.innerHTML =
        '<div class="agent-card">Load a task to see agents.</div>';
      metaEl.textContent = "0 agents";
      issuesEl.textContent = "No result loaded.";
      return;
    }

    const agentPlansAll = result.getAgentPlans();

    metaEl.textContent = `${agentPlansAll.length} agents`;

    const violations = result.getViolations?.() ?? [];
    const unassignedAgents = result.getUnassignedAgents?.() ?? [];
    const unassignedJobs = result.getUnassignedJobs?.() ?? [];
    const unassignedShipments = result.getUnassignedShipments?.() ?? [];
    const issueParts = [
      `${violations.length} violations`,
      `${unassignedAgents.length} unassigned agents`,
      `${unassignedJobs.length} unassigned jobs`,
      `${unassignedShipments.length} unassigned shipments`
    ];
    issuesEl.textContent =
      issueParts.every((part) => part.startsWith("0 "))
        ? "No issues reported."
        : `Issues: ${issueParts.join(", ")}`;

    agentPlansAll.forEach((agentPlan: AgentPlan | undefined, index: number) => {
      const color = getAgentColor(index);

      if (!agentPlan) {
        const card = document.createElement("div");
        card.className = "agent-card";

        const header = document.createElement("div");
        header.className = "agent-card__header";

        const title = document.createElement("div");
        title.className = "agent-card__title";
        title.textContent = `agent-${index + 1}`;
        title.style.color = color;

        const emptyNote = document.createElement("div");
        emptyNote.className = "agent-card__empty";
        emptyNote.textContent = "Agent is not planned.";

        header.appendChild(title);
        card.appendChild(header);
        card.appendChild(emptyNote);
        container.appendChild(card);
        return;
      }

      const stats = buildStats(agentPlan, result);
      const isHidden = (state.hiddenAgentIndexes || []).includes(index);

      const card = document.createElement("div");
      card.className = "agent-card";
      card.style.opacity = isHidden ? "0.6" : "1";
      card.addEventListener("click", () => {
        onFocusAgent(index);
      });

      const header = document.createElement("div");
      header.className = "agent-card__header";

      const title = document.createElement("div");
      title.className = "agent-card__title";
      title.textContent = agentPlan.getAgentId() || `agent-${index + 1}`;
      title.style.color = color;

      const toggleButton = document.createElement("button");
      toggleButton.className = "button button--ghost";
      toggleButton.textContent = isHidden ? "Show" : "Hide";
      toggleButton.addEventListener("click", (event) => {
        event.stopPropagation();
        onToggleAgent(index, !isHidden);
      });

      header.appendChild(title);
      header.appendChild(toggleButton);

      /* 
      ToDo: Add info about violations
      */

      const statsEl = document.createElement("div");
      statsEl.className = "agent-card__stats";
      statsEl.innerHTML = `
        <div>Stops: ${stats.stopCount}</div>
        <div>Jobs: ${stats.jobCount} - Shipments: ${stats.shipmentCount}</div>
        <div>Capacity: ${stats.pickupUsed}/${stats.pickupCap || "-"} pickup, ${stats.deliveryUsed}/${stats.deliveryCap || "-"} delivery</div>
        <div>Route: ${formatDuration(agentPlan.getTime())} - ${formatDistance(agentPlan.getDistance())}</div>
      `;

      const actionsEl = document.createElement("div");
      actionsEl.className = "agent-card__actions";

      const modifyButton = document.createElement("button");
      modifyButton.className = "button";
      modifyButton.textContent = "Modify";

      const editor = state.editor;
      const modifyPanel = editor
        ? createModifyPanel({
            agentIndex: index,
            result,
            editor,
            onResult: onUpdateResult
          })
        : document.createElement("div");
      modifyPanel.style.display = "none";

      modifyButton.disabled = !editor;
      modifyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        modifyPanel.style.display =
          modifyPanel.style.display === "none" ? "grid" : "none";
      });

      actionsEl.appendChild(modifyButton);

      card.appendChild(header);
      card.appendChild(statsEl);
      card.appendChild(actionsEl);
      card.appendChild(modifyPanel);

      container.appendChild(card);
    });
  });
}
