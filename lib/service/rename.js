"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lst = require("vscode-languageserver-types");
const types_1 = require("../types");
const checker_1 = require("../checker");
const _1 = require("../");
const util_1 = require("./util");
function renameSymbol(doc, sourceFile, position, newName) {
    if (!sourceFile.symbols)
        throw "sourceFile is not bound";
    if (!newName)
        return undefined;
    const g = sourceFile.graph;
    if (!g)
        return undefined;
    const offset = doc.offsetAt(position);
    const node = checker_1.findNodeAtOffset(g, offset);
    if (!node)
        return undefined;
    const parent = node.parent;
    if (_1.isIdentifierNode(node) && isRenamableIdentifier(node) && !!parent && isRenameableNode(parent)) {
        const nodeSymbol = node.symbol;
        if (!nodeSymbol)
            throw "node.symbol is not bound";
        const r = nodeSymbol.references;
        const refs = r ? [nodeSymbol.firstMention, ...r] : [nodeSymbol.firstMention];
        const ranges = util_1.syntaxNodesToRanges(doc, sourceFile, refs);
        const uri = doc.uri;
        const res = {
            changes: {
                [uri]: ranges.map(r => lst.TextEdit.replace(r, newName)),
            }
        };
        return res;
    }
    debugger;
    return undefined;
}
exports.renameSymbol = renameSymbol;
function isRenameableNode(node) {
    return node.kind === types_1.SyntaxKind.NodeId
        || node.kind === types_1.SyntaxKind.DirectedGraph
        || node.kind === types_1.SyntaxKind.UndirectedGraph;
}
function isRenamableIdentifier(node) {
    return node.kind !== types_1.SyntaxKind.QuotedTextIdentifier;
}
//# sourceMappingURL=rename.js.map