import { RoutePlannerTimeline } from "@sdk/route-planner-timeline";
import { RoutePlannerResult } from "@sdk/models";
import { AGENT_COLORS } from "../../core/agentColors";

export type DemoTimelineView = {
  render: (result: RoutePlannerResult | null) => void;
  setTimelineType: (type: "time" | "distance") => void;
  setHiddenAgents: (hiddenAgentIndexes: Set<number>) => void;
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
  let lastResult: RoutePlannerResult | null = null;
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
      timeline = null;
      lastResult = null;
      renderEmpty(container, metaEl);
      return;
    }

    const inputData = result.getRoutingOptions() as any;
    if (!timeline || result !== lastResult) {
      container.innerHTML = "";
      timeline = new RoutePlannerTimeline(container, inputData, result, {
        timelineType: currentType,
        agentColors: AGENT_COLORS,
        agentLabel: "Agent",
        capacityUnit: "items",
        showWaypointPopup: true,
        showTimelineLabels: false
      });
    } else {
      timeline.setAgentColors(AGENT_COLORS);
      timeline.setResult(result);
      timeline.setTimelineType(currentType);
      if (timeline.getShowTimelineLabels() !== false) {
        timeline.setShowTimelineLabels(false);
      }
    }

    lastResult = result;
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
