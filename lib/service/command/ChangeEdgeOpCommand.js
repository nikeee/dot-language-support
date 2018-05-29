"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lst = require("vscode-languageserver-types");
const common_1 = require("./common");
function create(startOffset, endOffset, changeTo, changeFrom) {
    const from = common_1.getEdgeStr(changeFrom);
    const to = common_1.getEdgeStr(changeTo);
    return {
        title: `Change "${from}" to "${to}".`,
        command: "DOT.changeEdgeOp",
        arguments: [startOffset, endOffset, to],
    };
}
exports.create = create;
function execute(doc, sourceFile, cmd) {
    if (!isChangeEdgeOpCommand(cmd))
        return undefined;
    const [startOffset, endOffset, changeTo] = cmd.arguments;
    const startPos = doc.positionAt(startOffset);
    const endPos = doc.positionAt(endOffset);
    return {
        label: `Change of invalid edge to "${changeTo}"'"`,
        edit: {
            changes: {
                [doc.uri]: [
                    lst.TextEdit.replace(lst.Range.create(startPos, endPos), changeTo),
                ],
            }
        }
    };
}
exports.execute = execute;
function isChangeEdgeOpCommand(cmd) {
    return cmd.command === "DOT.changeEdgeOp" && !!cmd.arguments && cmd.arguments.length === 3;
}
//# sourceMappingURL=ChangeEdgeOpCommand.js.map