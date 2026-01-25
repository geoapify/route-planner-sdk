import { AddAssignOptions } from "../../../../models";
import {RouteResultEditorBase} from "../../route-result-editor-base";

/**
 * Base interface for assign/add strategies
 */
export interface AssignStrategy {
    execute(
        context: RouteResultEditorBase,
        agentIndex: number,
        itemIndexes: number[],
        options: AddAssignOptions
    ): Promise<boolean>;
}

