"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
function create(edgeOffsets, changeEdgesTo, graphOffset, changeFromGraph, changeGraphTo) {
    const toGraph = common_1.getGraphKeywordStr(changeGraphTo);
    const title = changeGraphTo === changeFromGraph
        ? `Fix all edges to match ${toGraph}`
        : `Convert ${common_1.getGraphKeywordStr(changeFromGraph)} to ${toGraph}`;
    const edgeStr = common_1.getEdgeStr(changeEdgesTo);
    return {
        title,
        command: "DOT.convertGraphType",
        arguments: [edgeOffsets, edgeStr, graphOffset, toGraph],
    };
}
exports.create = create;
function execute(doc, sourceFile, cmd) {
    if (!isChangeAllOtherEdgeOpsAndFixGraphCommand(cmd))
        return undefined;
    const [edgeOffsets, changeEdgeTo, graphOffset, changeGraphTo] = cmd.arguments;
    const edits = edgeOffsets.map(o => {
        const startPos = doc.positionAt(o.start);
        const endPos = doc.positionAt(o.end);
        return common_1.createChangeToEdit(startPos, endPos, changeEdgeTo);
    });
    const graphStart = doc.positionAt(graphOffset.start);
    const graphEnd = doc.positionAt(graphOffset.end);
    edits.push(common_1.createChangeToEdit(graphStart, graphEnd, changeGraphTo));
    return {
        label: `Convert graph to "${changeGraphTo}"`,
        edit: {
            changes: {
                [doc.uri]: edits,
            }
        }
    };
}
exports.execute = execute;
function isChangeAllOtherEdgeOpsAndFixGraphCommand(cmd) {
    return cmd.command === "DOT.convertGraphType" && !!cmd.arguments && cmd.arguments.length === 4;
}
//# sourceMappingURL=ChangeAllOtherEdgeOpsAndFixGraphCommand.js.map