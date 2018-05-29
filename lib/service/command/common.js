"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lst = require("vscode-languageserver-types");
const _1 = require("../../");
function createChangeToEdit(start, end, changeTo) {
    return lst.TextEdit.replace(lst.Range.create(start, end), changeTo);
}
exports.createChangeToEdit = createChangeToEdit;
;
function getEdgeStr(op) {
    return op === _1.SyntaxKind.DirectedEdgeOp ? "->" : "--";
}
exports.getEdgeStr = getEdgeStr;
function getGraphKeywordStr(g) {
    return g === _1.SyntaxKind.DigraphKeyword ? "digraph" : "graph";
}
exports.getGraphKeywordStr = getGraphKeywordStr;
function getOppositeKind(g) {
    return g === _1.SyntaxKind.DigraphKeyword ? _1.SyntaxKind.GraphKeyword : _1.SyntaxKind.DigraphKeyword;
}
exports.getOppositeKind = getOppositeKind;
function getOppositeEdgeOp(g) {
    return g === _1.SyntaxKind.DirectedEdgeOp ? _1.SyntaxKind.UndirectedEdgeOp : _1.SyntaxKind.DirectedEdgeOp;
}
exports.getOppositeEdgeOp = getOppositeEdgeOp;
function getAllowedOp(g) {
    return g === _1.SyntaxKind.DigraphKeyword ? _1.SyntaxKind.DirectedEdgeOp : _1.SyntaxKind.UndirectedEdgeOp;
}
exports.getAllowedOp = getAllowedOp;
//# sourceMappingURL=common.js.map