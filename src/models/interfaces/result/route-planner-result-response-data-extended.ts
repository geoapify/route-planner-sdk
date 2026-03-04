import { RoutePlannerResultResponseData } from "./route-planner-result-response-data";
import { ViolationError } from "../../entities/route-editor-exceptions";

export interface RoutePlannerResultResponseDataExtended extends RoutePlannerResultResponseData {
    properties: RoutePlannerResultResponseData['properties'] & {
        violations?: ViolationError[];
    }
}
