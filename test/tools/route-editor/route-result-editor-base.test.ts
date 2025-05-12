import {RoutePlannerResultData} from "../../../src";
import {RoutePlannerResult} from "../../../src/models/entities/route-planner-result";
import {RouteResultEditorBase} from "../../../src/tools/route-editor/route-result-editor-base";
import { generateRawResponse, loadJson } from "../../utils.helper";
import TEST_API_KEY from "../../../env-variables";

const API_KEY = TEST_API_KEY;

describe('RouteResultEditorBase', () => {

    test('Should update updateUnassignedJobs and assign [] if unassignedJobs is undefined', async () => {
        let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, rawData, generateRawResponse());

        const editor = new RouteResultEditorBase(plannerResult);

        await editor['updateUnassignedJobs'](plannerResult);
        expect(rawData.unassignedJobs).toBeDefined();
    });

    test('Should update updateUnassignedAgents and assign [] if unassignedAgents is undefined', async () => {
        let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
        let rawData2: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-unassigned-agent-job-assigned.json");
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, rawData, generateRawResponse());
        let newPlannerResult = new RoutePlannerResult({apiKey: API_KEY}, rawData2, generateRawResponse());
        let unassignedAgents: number[];
        plannerResult.getData().unassignedAgents = unassignedAgents!;
        const editor = new RouteResultEditorBase(plannerResult);

        await editor['updateUnassignedAgents'](newPlannerResult);
        expect(rawData.unassignedAgents).toBeDefined();
    });

    test('Should update updateUnassignedJobs and assign [] if unassignedJobs is undefined', async () => {
        let rawData: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-assigned.json");
        let rawData2: RoutePlannerResultData = loadJson("data/route-planner-result-editor/job/result-data-job-assigned-agent-job-unassigned.json");
        let plannerResult = new RoutePlannerResult({apiKey: API_KEY}, rawData, generateRawResponse());
        let newPlannerResult = new RoutePlannerResult({apiKey: API_KEY}, rawData2, generateRawResponse());
        let unassignedJobs: number[];
        plannerResult.getData().unassignedJobs = unassignedJobs!;
        const editor = new RouteResultEditorBase(plannerResult);

        await editor['updateUnassignedJobs'](newPlannerResult);
        expect(rawData.unassignedJobs).toBeDefined();
    });

});