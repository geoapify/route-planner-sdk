import { RoutePlannerResultConverter } from "../../src/tools/route-planner-result-converter";
import { RoutePlannerResultResponseData } from "../../src";
import { loadJson } from "../utils.helper";

const RESULT_FILE =
    "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-result.json";

function loadResponse(): RoutePlannerResultResponseData {
    return loadJson(RESULT_FILE) as RoutePlannerResultResponseData;
}

describe("RoutePlannerResultConverter", () => {
    test("should convert response to internal result structure", () => {
        const response = loadResponse();
        const resultData = RoutePlannerResultConverter.generateRoutePlannerResultData(response);

        expect(resultData.inputData).toEqual(response.properties.params);
        expect(resultData.unassignedAgents).toEqual(response.properties.issues?.unassigned_agents);
        expect(resultData.unassignedJobs).toEqual(response.properties.issues?.unassigned_jobs);
        expect(resultData.unassignedShipments).toEqual(response.properties.issues?.unassigned_shipments);

        expect(resultData.agents).toHaveLength(response.features.length);
        expect(resultData.agents[0].agentIndex).toBe(response.features[0].properties.agent_index);
        expect(resultData.agents[0].agentId).toBe(response.features[0].properties.agent_id);
        expect(resultData.agents[0].actions).toHaveLength(response.features[0].properties.actions.length);
        expect(resultData.agents[0].legs).toHaveLength((response.features[0].properties.legs || []).length);
        expect(resultData.agents[0].waypoints).toHaveLength(response.features[0].properties.waypoints.length);
    });

    test("should clone data and not keep references to source response", () => {
        const response = loadResponse();
        const resultData = RoutePlannerResultConverter.generateRoutePlannerResultData(response);

        const originalType = resultData.agents[0].actions[0].type;
        const originalStartTime = resultData.agents[0].waypoints[0].start_time;

        response.features[0].properties.actions[0].type = "changed";
        response.features[0].properties.waypoints[0].start_time = 999999;

        expect(resultData.agents[0].actions[0].type).toBe(originalType);
        expect(resultData.agents[0].waypoints[0].start_time).toBe(originalStartTime);
    });
});
