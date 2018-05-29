"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("../");
const util_1 = require("./util");
const checker_1 = require("../checker");
const ChangeEdgeOpCommand = require("./command/ChangeEdgeOpCommand");
const ChangeAllOtherEdgeOpsAndFixGraphCommand = require("./command/ChangeAllOtherEdgeOpsAndFixGraphCommand");
const ConsolidateDescendantsCommand = require("./command/ConsolidateDescendantsCommand");
const common_1 = require("./command/common");
function getCodeActions(doc, sourceFile, range, context) {
    let actions = getActionsFromDiagnostics(doc, sourceFile, range);
    const general = getGeneralRefactorings(doc, sourceFile, range);
    if (general) {
        if (!actions)
            actions = general;
        else
            actions.push.apply(actions, general);
    }
    return actions;
}
exports.getCodeActions = getCodeActions;
function getActionsFromDiagnostics(doc, file, range) {
    const ds = file.diagnostics;
    if (!ds || ds.length === 0)
        return undefined;
    const rangeStartOffset = doc.offsetAt(range.start);
    const rangeEndOffset = doc.offsetAt(range.end);
    const res = [];
    for (const d of ds) {
        if (isInRange(rangeStartOffset, rangeEndOffset, d.start, d.end)) {
            const commands = getCommandsForDiagnostic(doc, file, d);
            if (commands && commands.length > 0)
                res.push.apply(res, commands);
        }
    }
    return res.length === 0 ? undefined : res;
}
function getGeneralRefactorings(doc, file, range) {
    if (!file.graph)
        return undefined;
    const g = file.graph;
    const kw = g.keyword;
    const rangeStartOffset = doc.offsetAt(range.start);
    const rangeEndOffset = doc.offsetAt(range.end);
    const keywordStart = util_1.getStart(file, kw);
    const res = [];
    if (isInRange(rangeStartOffset, rangeEndOffset, keywordStart, kw.end)) {
        if (!subtreeContainsErrors(g)) {
            const oppositeGraphType = common_1.getOppositeKind(kw.kind);
            const convertGraph = convertGraphTypeCommand(file, g, oppositeGraphType);
            res.push(convertGraph);
        }
    }
    if (rangeStartOffset === rangeEndOffset) {
        const candidates = [];
        let clickedNode = checker_1.findNodeAtOffset(g, rangeStartOffset);
        if (clickedNode && !!clickedNode.parent) {
            if (_1.isIdentifierNode(clickedNode)) {
                clickedNode = clickedNode.parent;
            }
            const clickedEdgeStatement = clickedNode.parent;
            if (clickedEdgeStatement && !subtreeContainsErrors(clickedEdgeStatement)) {
                if (checker_1.isEdgeStatement(clickedEdgeStatement)
                    && clickedEdgeStatement.rhs.length === 1
                    && checker_1.isNodeId(clickedEdgeStatement.source)
                    && !checker_1.edgeStatementHasAttributes(clickedEdgeStatement)) {
                    candidates.push(clickedEdgeStatement);
                    const source = clickedEdgeStatement.source;
                    const sourceText = checker_1.getIdentifierText(source.id);
                    const graphParent = clickedEdgeStatement.parent;
                    if (graphParent) {
                        let hasVisitedStatement = false;
                        let hasVisitedNodeModifier = false;
                        _1.forEachChild(graphParent, statement => {
                            if (statement === clickedEdgeStatement) {
                                hasVisitedStatement = true;
                                return undefined;
                            }
                            if (hasVisitedNodeModifier) {
                                return;
                            }
                            else if (checker_1.isAttrStatement(statement)
                                || subtreeContainsErrors(statement)) {
                                hasVisitedNodeModifier = true;
                                return true;
                            }
                            if (hasVisitedStatement) {
                                if (checker_1.isEdgeStatement(statement)
                                    && statement.rhs.length === 1
                                    && !checker_1.edgeStatementHasAttributes(statement)) {
                                    const statementSource = statement.source;
                                    if (checker_1.isNodeId(statementSource)) {
                                        const lowerSourceText = checker_1.getIdentifierText(statementSource.id);
                                        if (sourceText === lowerSourceText) {
                                            candidates.push(statement);
                                        }
                                    }
                                }
                            }
                            return undefined;
                        });
                    }
                }
                if (candidates.length > 1) {
                    const action = ConsolidateDescendantsCommand.create(candidates, true);
                    res.push(action);
                }
            }
        }
    }
    return res.length === 0 ? undefined : res;
    ;
}
function getCommandsForDiagnostic(doc, file, d) {
    switch (d.code.source) {
        case 1: return getScannerErrorCommand(doc, file, d, d.code);
        case 2: return getParserErrorCommand(doc, file, d, d.code);
        case 4: return getCheckerErrorCommand(doc, file, d, d.code);
        default: return util_1.assertNever(d.code);
    }
}
function getScannerErrorCommand(doc, file, d, code) {
    console.assert(d.code.source === 1);
    console.assert(code.source === 1);
    return undefined;
}
function getParserErrorCommand(doc, file, d, code) {
    console.assert(d.code.source === 2);
    console.assert(code.source === 2);
    return undefined;
}
function getCheckerErrorCommand(doc, file, d, code) {
    console.assert(d.code.source === 4);
    console.assert(code.source === 4);
    switch (code.sub) {
        case 0: {
            const graph = file.graph;
            if (!graph)
                return undefined;
            const allowedOp = checker_1.getAllowedEdgeOperation(graph);
            const wrongOp = common_1.getOppositeEdgeOp(allowedOp);
            const kwk = graph.keyword.kind;
            const fixSingleEdge = ChangeEdgeOpCommand.create(d.start, d.end, allowedOp, wrongOp);
            const fixAll = convertGraphTypeCommand(file, graph, kwk);
            const convertToThisWrongType = convertGraphTypeCommand(file, graph, common_1.getOppositeKind(kwk));
            return [
                fixSingleEdge,
                fixAll,
                convertToThisWrongType,
            ];
        }
    }
}
function convertGraphTypeCommand(file, graph, changeToGraphType) {
    const changeToEdgeOp = common_1.getAllowedOp(changeToGraphType);
    const allEdges = checker_1.findAllEdges(graph);
    const edgeOffsets = allEdges
        .filter(e => e.operation.kind !== changeToEdgeOp)
        .map(e => ({
        start: util_1.getStart(file, e.operation),
        end: e.operation.end
    }));
    const graphTypeOffset = {
        start: util_1.getStart(file, graph.keyword),
        end: graph.keyword.end
    };
    return ChangeAllOtherEdgeOpsAndFixGraphCommand.create(edgeOffsets, changeToEdgeOp, graphTypeOffset, graph.keyword.kind, changeToGraphType);
}
function isInRange(rangeStartOffset, rangeEndOffset, startOffset, endOffset) {
    if (rangeStartOffset === rangeEndOffset)
        return startOffset <= rangeStartOffset && rangeEndOffset <= endOffset;
    if (rangeStartOffset === startOffset && rangeEndOffset === endOffset)
        return true;
    return false;
}
const commandHandlers = {
    ["DOT.changeEdgeOp"]: ChangeEdgeOpCommand.execute,
    ["DOT.convertGraphType"]: ChangeAllOtherEdgeOpsAndFixGraphCommand.execute,
    ["DOT.consolidateDescendants"]: ConsolidateDescendantsCommand.execute,
};
function getAvailableCommands() {
    return Object.keys(commandHandlers);
}
exports.getAvailableCommands = getAvailableCommands;
function executeCommand(doc, sourceFile, cmd) {
    const handler = commandHandlers[cmd.command];
    return handler === undefined
        ? undefined
        : handler(doc, sourceFile, cmd);
}
exports.executeCommand = executeCommand;
function subtreeContainsErrors(node) {
    if (hasNodeError(node))
        return true;
    let hasError = false;
    _1.forEachChild(node, child => {
        if (hasNodeError(child)) {
            hasError = true;
        }
        if (!hasError) {
            hasError = subtreeContainsErrors(child);
        }
    });
    return hasError;
}
function hasNodeError(node) {
    return (node.flags & 2) === 2;
}
//# sourceMappingURL=codeAction.js.map