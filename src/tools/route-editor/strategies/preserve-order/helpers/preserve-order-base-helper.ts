import {RouteResultEditorBase} from "../../../route-result-editor-base";

export class PreserveOrderBaseHelper {

    static getEndPosition(context: RouteResultEditorBase, agentIndex: number): number {
        const agentFeature = context.getOrCreateAgentFeature(agentIndex);
        const actions = agentFeature.properties.actions;
        return context.findEndActionIndex(actions);
    }
}