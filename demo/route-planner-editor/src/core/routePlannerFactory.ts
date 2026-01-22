import { getTaskById, loadTaskInput } from "../data/demoRequests";
import { getAPIKey } from "./geoapifyApiConfig";
import { createRoutePlannerLoggerProxy } from "../units/logger/routePlannerLoggerProxy";
import type { DemoLogger } from "../units/logger/logger";
import { RoutePlannerResult } from "@sdk/models";
import { RoutePlanner } from "@sdk/route-planner";

const demoOptions = {
  apiKey: getAPIKey(),
  baseUrl: "https://api.geoapify.com"
};

export async function createRoutePlannerForTask(
  taskId: string,
  logger: DemoLogger
) {
  const task = getTaskById(taskId);
  if (!task) {
    throw new Error(`Unknown task: ${taskId}`);
  }

  const input = await loadTaskInput(task);

  const plannerInstance = new RoutePlanner(demoOptions, input);
  const planner = createRoutePlannerLoggerProxy(
    plannerInstance,
    logger,
    "RoutePlanner"
  );
  const result: RoutePlannerResult = await planner.plan();

  logger.log({
    method: "RoutePlanner.create",
    detail: `Loaded ${task.label}`
  });

  return {
    task,
    planner,
    result
  };
}
