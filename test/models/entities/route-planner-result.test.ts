import { RouteAction, RouteLeg, RoutePlannerResultResponseData, Waypoint } from "../../../src";
import { RoutePlannerResult } from "../../../src/models/entities/route-planner-result";
import { RoutePlannerCallOptions } from "../../../src/models/interfaces/route-planner-call-options";
import { loadJson } from "../../utils.helper";

const JOBS_RESULT_FILE =
    "_data/live-scenarios/bulky-items-houston__init-jobs_jobs-250_shipments-0_items-req-no_items-tw-no_agents-5_agent-caps-no_agent-tw-no_agent-breaks-no_agent-end-yes_agent-capacity-yes-result.json";
const SHIPMENTS_RESULT_FILE =
    "_data/live-scenarios/simple-delivery-berlin__init-shipments_jobs-0_shipments-82_items-req-no_items-tw-no_agents-3_agent-caps-no_agent-tw-yes_agent-breaks-no_agent-end-no_agent-capacity-no-result.json";

describe("RoutePlannerResult", () => {
    let options: RoutePlannerCallOptions;
    let jobsRaw: RoutePlannerResultResponseData;
    let shipmentsRaw: RoutePlannerResultResponseData;
    let jobsResult: RoutePlannerResult;
    let shipmentsResult: RoutePlannerResult;

    beforeEach(() => {
        options = {
            apiKey: "API_KEY",
            baseUrl: "BASE_URL",
            httpOptions: {
                header1: {
                    key: "header1Key"
                }
            }
        };

        jobsRaw = loadJson(JOBS_RESULT_FILE);
        shipmentsRaw = loadJson(SHIPMENTS_RESULT_FILE);
        jobsResult = new RoutePlannerResult(options, jobsRaw);
        shipmentsResult = new RoutePlannerResult(options, shipmentsRaw);
    });

    test("should keep raw response and call options", () => {
        expect(jobsResult.getRaw()).toEqual(jobsRaw);
        expect(jobsResult.getCallOptions()).toEqual(options);
    });

    test("should build agent plans array aligned with input agents", () => {
        const plans = jobsResult.getAgentPlans();
        expect(plans.length).toBe(jobsRaw.properties.params.agents.length);

        const usedCount = plans.filter(Boolean).length;
        expect(usedCount).toBe(jobsRaw.features.length);
    });

    test("should get agent plan by index and return undefined for missing", () => {
        expect(jobsResult.getAgentPlan(0)).toBeDefined();
        expect(jobsResult.getAgentPlan(-1)).toBeUndefined();
        expect(jobsResult.getAgentPlan("__missing_agent__")).toBeUndefined();
    });

    test("should expose waypoints/actions/legs wrappers for an existing agent", () => {
        const plan = jobsResult.getAgentPlan(0);
        expect(plan).toBeDefined();

        const waypoints = plan!.getWaypoints();
        const actions = plan!.getActions();
        const legs = plan!.getLegs();

        expect(waypoints.length).toBeGreaterThan(0);
        expect(actions.length).toBeGreaterThan(0);
        expect(legs.length).toBeGreaterThan(0);
        expect(waypoints[0]).toBeInstanceOf(Waypoint);
        expect(actions[0]).toBeInstanceOf(RouteAction);
        expect(legs[0]).toBeInstanceOf(RouteLeg);
    });

    test("should return unassigned agents from issues", () => {
        const issueIndexes = jobsRaw.properties.issues?.unassigned_agents || [];
        expect(jobsResult.getUnassignedAgents().length).toBe(issueIndexes.length);
    });

    test("should return empty unassigned lists when issues are missing", () => {
        const rawNoIssues = JSON.parse(JSON.stringify(jobsRaw));
        delete rawNoIssues.properties.issues;
        const resultNoIssues = new RoutePlannerResult(options, rawNoIssues);

        expect(resultNoIssues.getUnassignedAgents()).toEqual([]);
        expect(resultNoIssues.getUnassignedJobs()).toEqual([]);
        expect(resultNoIssues.getUnassignedShipments()).toEqual([]);
    });

    test("should map unassigned jobs and shipments from issue indexes", () => {
        const rawWithIssues = JSON.parse(JSON.stringify(shipmentsRaw));
        rawWithIssues.properties.issues = {
            unassigned_agents: [0],
            unassigned_jobs: [0],
            unassigned_shipments: [0]
        };
        rawWithIssues.properties.params.jobs = [
            {
                id: "job-0",
                location: [1, 1],
                duration: 10
            }
        ];
        const resultWithIssues = new RoutePlannerResult(options, rawWithIssues);

        expect(resultWithIssues.getUnassignedAgents()).toEqual([
            rawWithIssues.properties.params.agents[0]
        ]);
        expect(resultWithIssues.getUnassignedJobs()).toEqual([
            rawWithIssues.properties.params.jobs[0]
        ]);
        expect(resultWithIssues.getUnassignedShipments()).toEqual([
            rawWithIssues.properties.params.shipments[0]
        ]);
    });

    test("should resolve job plan by index and return undefined for missing", () => {
        const plan = jobsResult.getJobPlan(0);
        expect(plan).toBeDefined();
        expect(plan!.getJobIndex()).toBe(0);
        expect(plan!.getJobInputData()).toEqual(jobsResult.getData().inputData.jobs[0]);
        expect(jobsResult.getJobPlan(999999)).toBeUndefined();
        expect(jobsResult.getJobPlan("__missing_job__")).toBeUndefined();
    });

    test("should resolve shipment plan by index and id and track unassigned", () => {
        const firstShipment = shipmentsResult.getData().inputData.shipments[0];
        const byIndex = shipmentsResult.getShipmentPlan(0);
        expect(byIndex).toBeDefined();
        expect(byIndex!.getShipmentIndex()).toBe(0);
        expect(byIndex!.getShipmentInputData()).toEqual(firstShipment);

        const shipmentId = firstShipment.id;
        if (shipmentId) {
            const byId = shipmentsResult.getShipmentPlan(shipmentId);
            expect(byId).toBeDefined();
            expect(byId!.getShipmentIndex()).toBe(0);
        }

        const unassignedIndexes = shipmentsRaw.properties.issues?.unassigned_shipments || [];
        expect(shipmentsResult.getUnassignedShipments().length).toBe(unassignedIndexes.length);
        expect(shipmentsResult.getShipmentPlan("__missing_shipment__")).toBeUndefined();
    });

    test("should expose full plan collections and routing options", () => {
        expect(jobsResult.getJobPlans()).toHaveLength(jobsResult.getData().inputData.jobs.length);
        expect(shipmentsResult.getShipmentPlans()).toHaveLength(shipmentsResult.getData().inputData.shipments.length);
        expect(jobsResult.getRoutingOptions()).toEqual(jobsResult.getData().inputData);
    });

    test("should keep only violations that belong to the current agent", () => {
        const rawWithViolations = JSON.parse(JSON.stringify(jobsRaw));
        const firstAgentIndex = rawWithViolations.features[0].properties.agent_index;
        rawWithViolations.properties.violations = [
            { message: "belongs", agentIndex: firstAgentIndex, name: "ViolationError" },
            { message: "other", agentIndex: 9999, name: "ViolationError" }
        ];

        const resultWithViolations = new RoutePlannerResult(options, rawWithViolations);
        const agentViolations = resultWithViolations.getAgentPlan(firstAgentIndex)?.getViolations() || [];

        expect(agentViolations).toHaveLength(1);
        expect(agentViolations[0].agentIndex).toBe(firstAgentIndex);
        expect(agentViolations[0].message).toBe("belongs");
    });
});
