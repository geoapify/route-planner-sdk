import RoutePlanner, {
    RoutePlannerInputData,
    RoutePlannerResult
} from "../../../src";
import TEST_API_KEY from "../../../env-variables";
import { loadJson } from "../../utils.helper";

export const LIVE_TEST_API_KEY = TEST_API_KEY;
export const hasLiveApiKey = LIVE_TEST_API_KEY !== "TEST_API_KEY";

const DEFAULT_JOBS_INPUT_FILE =
    "_data/live-scenarios/salesman-with-time-frames__init-jobs_jobs-30_shipments-0_items-req-no_items-tw-yes_agents-3_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-no-input.json";
const DEFAULT_SHIPMENTS_INPUT_FILE =
    "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-input.json";

export async function buildResultFromInputFile(fileName: string): Promise<RoutePlannerResult> {
    const inputData = loadJson(fileName) as RoutePlannerInputData;
    const planner = new RoutePlanner({ apiKey: LIVE_TEST_API_KEY }, inputData);
    return planner.plan();
}

export async function buildJobsResult(fileName = DEFAULT_JOBS_INPUT_FILE): Promise<RoutePlannerResult> {
    return buildResultFromInputFile(fileName);
}

export async function buildShipmentsResult(fileName = DEFAULT_SHIPMENTS_INPUT_FILE): Promise<RoutePlannerResult> {
    return buildResultFromInputFile(fileName);
}
