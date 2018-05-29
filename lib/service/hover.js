"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const checker_1 = require("../checker");
const _1 = require("../");
const util_1 = require("./util");
function hover(doc, sourceFile, position) {
    const offset = doc.offsetAt(position);
    const g = sourceFile.graph;
    if (!g)
        return undefined;
    const node = checker_1.findNodeAtOffset(g, offset);
    if (node === undefined)
        return undefined;
    return getNodeHover(doc, sourceFile, node);
}
exports.hover = hover;
function getNodeHover(doc, sf, n) {
    const start = doc.positionAt(util_1.getStart(sf, n));
    const end = doc.positionAt(n.end);
    return {
        contents: getHoverContents(n),
        range: { start, end },
    };
}
function getHoverContents(n) {
    if (_1.isIdentifierNode(n)) {
        const parent = n.parent;
        if (parent) {
            switch (parent.kind) {
                case types_1.SyntaxKind.NodeId:
                    return `Node "${checker_1.getIdentifierText(n)}"`;
                case types_1.SyntaxKind.Assignment: {
                    const assignment = parent;
                    const left = checker_1.getIdentifierText(assignment.leftId);
                    const right = checker_1.getIdentifierText(assignment.rightId);
                    return `Assigmnent of \`${left}\` to \`${right}\``;
                }
                case types_1.SyntaxKind.DirectedGraph: {
                    const graphId = parent.id;
                    if (graphId)
                        return `Directed graph "${graphId}"`;
                    return `Unnamed directed graph`;
                }
                case types_1.SyntaxKind.UndirectedGraph: {
                    const graphId = parent.id;
                    if (graphId)
                        return `Undirected graph "${graphId}"`;
                    return `Unnamed undirected graph`;
                }
                case types_1.SyntaxKind.SubGraphStatement: {
                    const sgs = parent;
                    const sg = sgs.subgraph;
                    if (sg.id)
                        return `Sub graph "${checker_1.getIdentifierText(sg.id)}"`;
                    return `Unnamed sub graph`;
                }
                case types_1.SyntaxKind.SubGraph: {
                    const sg = parent;
                    if (sg.id)
                        return `Sub graph "${checker_1.getIdentifierText(sg.id)}"`;
                    return `Unnamed sub graph`;
                }
                case types_1.SyntaxKind.IdEqualsIdStatement: {
                    const idEqId = parent;
                    const left = checker_1.getIdentifierText(idEqId.leftId);
                    const right = checker_1.getIdentifierText(idEqId.rightId);
                    return `Setting variable \`${left}\` to \`${right}\``;
                }
            }
            return types_1.SyntaxKind[parent.kind];
        }
        return types_1.SyntaxKind[n.kind];
    }
    return "TODO";
}
//# sourceMappingURL=hover.js.map