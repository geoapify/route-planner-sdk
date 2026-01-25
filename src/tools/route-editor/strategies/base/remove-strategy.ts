import { RemoveOptions } from "../../../../models";
import {RouteResultEditorBase} from "../../route-result-editor-base";

/**
 * Base interface for remove strategies
 */
export interface RemoveStrategy {
    execute(
        context: RouteResultEditorBase,
        itemIndexes: number[],
        options: RemoveOptions
    ): Promise<boolean>;
}

