"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
function visitNode(cbNode, node) {
    return node && cbNode(node);
}
function visitNodes(cbNode, cbNodes, nodes) {
    if (nodes) {
        if (cbNodes)
            return cbNodes(nodes);
        for (const node of nodes) {
            const result = cbNode(node);
            if (result)
                return result;
        }
    }
    return undefined;
}
function forEachChild(node, cbNode, cbNodes) {
    if (!node || node.kind <= types_1.SyntaxKind.LastKeyword)
        return;
    switch (node.kind) {
        case types_1.SyntaxKind.DirectedGraph:
        case types_1.SyntaxKind.UndirectedGraph:
            return visitNodes(cbNode, cbNodes, node.statements)
                || visitNode(cbNode, node.strict)
                || visitNode(cbNode, node.id);
        case types_1.SyntaxKind.AttributeStatement:
            return visitNodes(cbNode, cbNodes, node.attributes)
                || visitNode(cbNode, node.subject)
                || visitNode(cbNode, node.terminator);
        case types_1.SyntaxKind.EdgeStatement:
            return visitNodes(cbNode, cbNodes, node.attributes)
                || visitNodes(cbNode, cbNodes, node.rhs)
                || visitNode(cbNode, node.source)
                || visitNode(cbNode, node.terminator);
        case types_1.SyntaxKind.NodeStatement:
            return visitNodes(cbNode, cbNodes, node.attributes)
                || visitNode(cbNode, node.id)
                || visitNode(cbNode, node.terminator);
        case types_1.SyntaxKind.SubGraph:
            return visitNodes(cbNode, cbNodes, node.statements)
                || visitNode(cbNode, node.id);
        case types_1.SyntaxKind.SubGraphStatement:
            return visitNode(cbNode, node.subgraph)
                || visitNode(cbNode, node.terminator);
        case types_1.SyntaxKind.IdEqualsIdStatement:
            return visitNode(cbNode, node.leftId)
                || visitNode(cbNode, node.rightId)
                || visitNode(cbNode, node.terminator);
        case types_1.SyntaxKind.QuotedTextIdentifier:
            return visitNodes(cbNode, cbNodes, node.values);
        case types_1.SyntaxKind.EdgeRhs:
            return visitNode(cbNode, node.operation)
                || visitNode(cbNode, node.target);
        case types_1.SyntaxKind.AttributeContainer:
            return visitNodes(cbNode, cbNodes, node.assignments);
        case types_1.SyntaxKind.Assignment:
            return visitNode(cbNode, node.leftId)
                || visitNode(cbNode, node.rightId)
                || visitNode(cbNode, node.terminator);
        case types_1.SyntaxKind.NormalPointDeclaration:
            return visitNode(cbNode, node.colon)
                || visitNode(cbNode, node.id)
                || visitNode(cbNode, node.compassPt);
        case types_1.SyntaxKind.CompassPointDeclaration:
            return visitNode(cbNode, node.colon)
                || visitNode(cbNode, node.compassPt);
        case types_1.SyntaxKind.NodeId:
            return visitNode(cbNode, node.point)
                || visitNode(cbNode, node.id);
        default:
            return undefined;
    }
}
exports.forEachChild = forEachChild;
//# sourceMappingURL=visitor.js.map