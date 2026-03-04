import { RoutePlannerTimeline } from "@sdk/route-planner-timeline";
import { RoutePlannerResult, Waypoint } from "@sdk/models";
import { AGENT_COLORS } from "../../core/agentColors";

export type DemoTimelineView = {
  render: (result: RoutePlannerResult | null) => void;
  setTimelineType: (type: "time" | "distance") => void;
  setHiddenAgents: (hiddenAgentIndexes: Set<number>) => void;
};

const buildWaypointPopup = (
  result: RoutePlannerResult,
  waypoint?: Waypoint
): HTMLElement => {
  if (!waypoint) {
    const popup = document.createElement("div");
    popup.style.margin = "0";
    popup.style.padding = "0";
    popup.textContent = "Waypoint: n/a";
    return popup;
  }

  let waypointIndex = waypoint.getActions()[0]?.getWaypointIndex() ?? 0;
  let distanceMeters = 0;

  const targetRaw = waypoint.getRaw();
  for (const agentPlan of result.getAgentPlans()) {
    if (!agentPlan) {
      continue;
    }

    const waypoints = agentPlan.getWaypoints();
    const matchedIndex = waypoints.findIndex(
      (agentWaypoint) => agentWaypoint.getRaw() === targetRaw
    );

    if (matchedIndex === -1) {
      continue;
    }

    waypointIndex = matchedIndex;
    for (const leg of agentPlan.getLegs()) {
      if (leg.getToWaypointIndex() <= matchedIndex) {
        distanceMeters += leg.getDistance() || 0;
      }
    }
    break;
  }

  const popup = document.createElement("div");
  popup.style.margin = "0";
  popup.style.padding = "0";
  popup.style.lineHeight = "1.2";

  const waypointLine = document.createElement("div");
  waypointLine.style.margin = "0";
  waypointLine.style.padding = "0";
  waypointLine.textContent = `Waypoint: #${waypointIndex}`;

  const timeLine = document.createElement("div");
  timeLine.style.margin = "0";
  timeLine.style.padding = "0";
  timeLine.textContent = `Time: ${Math.round(waypoint.getStartTime() || 0)}s`;

  const distanceLine = document.createElement("div");
  distanceLine.style.margin = "0";
  distanceLine.style.padding = "0";
  distanceLine.textContent = `Distance: ${Math.round(distanceMeters)}m`;

  const actionsLine = document.createElement("div");
  actionsLine.style.margin = "0";
  actionsLine.style.padding = "0";
  const actionOrder = ["start", "end", "delivery", "pickup"];
  const actionGroups = new Map<string, string[]>();

  waypoint.getActions().forEach((action) => {
    const type = action.getType();
    const jobId = action.getJobId();
    const jobIndex = action.getJobIndex();
    const shipmentId = action.getShipmentId();
    const shipmentIndex = action.getShipmentIndex();

    let actionRef = "";
    if (jobId || jobIndex !== undefined) {
      actionRef = `${jobId || `#${jobIndex}`}`;
    } else if (shipmentId || shipmentIndex !== undefined) {
      actionRef = `${shipmentId || `#${shipmentIndex}`}`;
    }

    if (!actionGroups.has(type)) {
      actionGroups.set(type, []);
    }
    if (actionRef) {
      actionGroups.get(type)!.push(actionRef);
    }
  });

  const orderedTypes = [
    ...actionOrder.filter((type) => actionGroups.has(type)),
    ...Array.from(actionGroups.keys()).filter(
      (type) => !actionOrder.includes(type)
    )
  ];

  const actions = orderedTypes
    .map((type) => {
      const refs = actionGroups.get(type) || [];
      return refs.length ? `${type}(${refs.join(", ")})` : type;
    })
    .join(", ");
  actionsLine.textContent = `Actions: ${actions || "none"}`;

  popup.append(waypointLine, timeLine, distanceLine, actionsLine);

  return popup;
};

const renderEmpty = (container: HTMLElement, metaEl?: HTMLElement) => {
  container.innerHTML =
    '<div class="timeline__item">No stops yet. Load a task.</div>';
  if (metaEl) {
    metaEl.textContent = "No stops available.";
  }
};

export const createTimelineView = (
  container: HTMLElement,
  metaEl?: HTMLElement
): DemoTimelineView => {
  let timeline: RoutePlannerTimeline | null = null;
  let popupResult: RoutePlannerResult | null = null;
  let currentType: "time" | "distance" = "time";

  const updateMeta = (result: RoutePlannerResult) => {
    const plans = result.getAgentPlans();
    const totalAgents = plans.length;
    const totalStops = plans.reduce(
      (sum, plan) => sum + (plan ? plan.getWaypoints().length : 0),
      0
    );
    if (metaEl) {
      metaEl.textContent = `${totalStops} stops across ${totalAgents} agents`;
    }
  };

  const render = (result: RoutePlannerResult | null) => {
    if (!result) {
      popupResult = null;
      renderEmpty(container, metaEl);
      return;
    }

    popupResult = result;
    const inputData = result.getRoutingOptions() as any;
    if (!timeline) {
      container.innerHTML = "";
      timeline = new RoutePlannerTimeline(container, inputData, result, {
        timelineType: currentType,
        agentColors: AGENT_COLORS,
        agentLabel: "Agent",
        capacityUnit: "items",
        showWaypointPopup: true,
        showTimelineLabels: false,
        waypointPopupGenerator: (waypoint: Waypoint) =>
          buildWaypointPopup(popupResult || result, waypoint)
      });
    }

    timeline.setAgentColors(AGENT_COLORS);
    timeline.setResult(result);
    timeline.setTimelineType(currentType);
    if (timeline.getShowTimelineLabels() !== false) {
      timeline.setShowTimelineLabels(false);
    }

    updateMeta(result);
  };

  const setTimelineType = (type: "time" | "distance") => {
    currentType = type;
    if (timeline) {
      timeline.setTimelineType(type);
    }
  };

  const setHiddenAgents = (_hiddenAgentIndexes: Set<number>) => undefined;

  return { render, setTimelineType, setHiddenAgents };
};
