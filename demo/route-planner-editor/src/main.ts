import { demoTasks } from "./data/demoRequests";
import { createStore } from "./core/store";
import { createRoutePlannerForTask } from "./core/routePlannerFactory";
import { initTaskSelector } from "./units/taskSelector/taskSelector";
import { createPlanVisualizer } from "./units/planVisualizer/planVisualizer";
import { createAgentsPanel } from "./units/agentsPanel/agentsPanel";
import { bindLoggerPanel, createLogger } from "./units/logger/logger";
import { RoutePlannerResultEditor } from "@sdk/route-planner-result-editor";
import { createRoutePlannerLoggerProxy } from "./units/logger/routePlannerLoggerProxy";

const store = createStore({
  planner: null,
  result: null,
  editor: null,
  taskId: null,
  hiddenAgentIndexes: []
});

const logger = createLogger();

const taskSelect = document.getElementById("task-select") as HTMLSelectElement;
const taskLoad = document.getElementById("task-load") as HTMLButtonElement;
const taskStatus = document.getElementById("task-status") as HTMLElement;
const mapContainer = document.getElementById("map") as HTMLElement;
const timelineContainer = document.getElementById("timeline") as HTMLElement;
const timelineMeta = document.getElementById("timeline-meta") as HTMLElement;
const agentsList = document.getElementById("agents-list") as HTMLElement;
const agentsMeta = document.getElementById("agents-meta") as HTMLElement;
const agentsIssues = document.getElementById("agents-issues") as HTMLElement;
const logList = document.getElementById("log-list") as HTMLElement;
const logClear = document.getElementById("log-clear") as HTMLButtonElement;
const logCopy = document.getElementById("log-copy") as HTMLButtonElement;
const timelineModeTime = document.getElementById(
  "timeline-mode-time"
) as HTMLButtonElement;
const timelineModeDistance = document.getElementById(
  "timeline-mode-distance"
) as HTMLButtonElement;

bindLoggerPanel(logList, logClear, logCopy, logger);

initTaskSelector(taskSelect, taskLoad, demoTasks, async (taskId) => {
  store.setState({
    planner: null,
    result: null,
    editor: null,
    taskId: null,
    hiddenAgentIndexes: []
  });
  taskStatus.textContent = "Planning route...";
  taskStatus.classList.add("topbar__status--loading");
  try {
    const { task, planner, result } = await createRoutePlannerForTask(
      taskId,
      logger
    );

    console.log(planner);

    const editor = new RoutePlannerResultEditor(result);
    
    store.setState({
      planner,
      result,
      editor: createRoutePlannerLoggerProxy(editor, logger, "RoutePlannerResultEditor"),
      taskId: task.id
    });

    taskStatus.textContent = `Loaded ${task.label}`;
    taskStatus.classList.remove("topbar__status--loading");
  } catch (error) {
    console.log(error);
    taskStatus.textContent = "Failed to load task.";
    taskStatus.classList.remove("topbar__status--loading");
    logger.log({
      method: "RoutePlanner.error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

const planVisualizer = createPlanVisualizer(
  mapContainer,
  timelineContainer,
  timelineMeta,
  store
);

const setTimelineButtons = (mode: "time" | "distance") => {
  const isTime = mode === "time";
  timelineModeTime.classList.toggle("button--primary", isTime);
  timelineModeTime.classList.toggle("button--ghost", !isTime);
  timelineModeDistance.classList.toggle("button--primary", !isTime);
  timelineModeDistance.classList.toggle("button--ghost", isTime);
  planVisualizer.setTimelineType(mode);
};

timelineModeTime.addEventListener("click", () => {
  setTimelineButtons("time");
});

timelineModeDistance.addEventListener("click", () => {
  setTimelineButtons("distance");
});

createAgentsPanel(
  agentsList,
  agentsMeta,
  agentsIssues,
  store,
  (agentIndex) => planVisualizer.focusAgent(agentIndex),
  (agentIndex, hidden) => {
    const current = new Set(store.getState().hiddenAgentIndexes || []);
    if (hidden) {
      current.add(agentIndex);
    } else {
      current.delete(agentIndex);
    }
    store.setState({
      hiddenAgentIndexes: Array.from(current).sort((a, b) => a - b)
    });
  },
  (result) => store.setState({ result })
);

store.subscribe((state) => {
  if (!state.taskId) {
    taskStatus.textContent = "No task loaded";
  }
});
