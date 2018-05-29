"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const util_1 = require("./service/util");
const visitor_1 = require("./visitor");
function checkSourceFile(file) {
    const g = file.graph;
    if (g) {
        const messages = checkGraphSemantics(file, g);
        if (messages) {
            file.diagnostics.push.apply(file.diagnostics, messages);
        }
    }
}
exports.checkSourceFile = checkSourceFile;
function getNarrowerNode(offset, prev, toCheck) {
    const prevRange = prev.end - prev.pos;
    if (toCheck.pos <= offset && offset <= toCheck.end) {
        let nrange = toCheck.end - toCheck.pos;
        if (nrange < prevRange) {
            return toCheck;
        }
    }
    return prev;
}
function findNodeAtOffset(root, offset) {
    if (root.pos <= offset && offset <= root.end) {
        let candidate = root;
        visitor_1.forEachChild(root, n => {
            const r = findNodeAtOffset(n, offset);
            if (r && (candidate.end - candidate.end) < (root.end - root.pos))
                candidate = r;
        }, ns => {
            for (const n of ns) {
                const r = findNodeAtOffset(n, offset);
                if (r && (candidate.end - candidate.end) < (root.end - root.pos))
                    candidate = r;
            }
        });
        return candidate;
    }
    return undefined;
}
exports.findNodeAtOffset = findNodeAtOffset;
function getAllowedEdgeOperation(graph) {
    return graph.kind === types_1.SyntaxKind.DirectedGraph
        ? types_1.SyntaxKind.DirectedEdgeOp
        : types_1.SyntaxKind.UndirectedEdgeOp;
}
exports.getAllowedEdgeOperation = getAllowedEdgeOperation;
function checkGraphSemantics(file, root) {
    const expectedEdgeOp = getAllowedEdgeOperation(root);
    const invalidEdgeRhses = findEdgeErrors(expectedEdgeOp, root);
    return invalidEdgeRhses == undefined || invalidEdgeRhses.length === 0
        ? undefined
        : createEdgeViolationDiagnostics(file, expectedEdgeOp, invalidEdgeRhses);
}
function findAllEdges(node) {
    const allEdges = [];
    visitor_1.forEachChild(node, child => {
        if (isEdgeStatement(child)) {
            if (child.rhs && child.rhs.length > 0) {
                allEdges.push.apply(allEdges, child.rhs);
            }
        }
        const childEdges = findAllEdges(child);
        if (childEdges && childEdges.length > 0)
            allEdges.push.apply(allEdges, childEdges);
    });
    return allEdges;
}
exports.findAllEdges = findAllEdges;
function findEdgeErrors(expectedEdgeOp, node) {
    const edges = findAllEdges(node);
    const wrongEdges = edges && edges.length > 0
        ? edges.filter(e => e.operation.kind !== expectedEdgeOp)
        : undefined;
    if (wrongEdges && wrongEdges.length > 0) {
        wrongEdges.forEach(e => e.operation.flags != 2);
        return wrongEdges;
    }
    return undefined;
}
function createEdgeViolationDiagnostics(file, expectedEdgeOp, violators) {
    const op = expectedEdgeOp === types_1.SyntaxKind.UndirectedEdgeOp ? "--" : "->";
    const graphType = expectedEdgeOp === types_1.SyntaxKind.UndirectedEdgeOp ? "undirected" : "directed";
    const message = `Invalid edge operation, use "${op}" in ${graphType} graph`;
    const code = createCheckerError(0);
    const category = types_1.DiagnosticCategory.Error;
    violators.forEach(edge => edge.operation.flags |= 2);
    return violators.map(edge => {
        const start = util_1.getStart(file, edge.operation);
        const end = edge.operation.end;
        return {
            message,
            code,
            category,
            start,
            end,
        };
    });
}
function getInvalidEdgeRhs(allowedOp, edges) {
    const res = [];
    for (const e of edges) {
        if (e.operation.kind !== allowedOp)
            res.push(e);
    }
    return res;
}
function isAttrStatement(node) {
    return node.kind === types_1.SyntaxKind.AttributeStatement;
}
exports.isAttrStatement = isAttrStatement;
function isEdgeStatement(node) {
    return node.kind === types_1.SyntaxKind.EdgeStatement;
}
exports.isEdgeStatement = isEdgeStatement;
function isSubGraphStatement(node) {
    return node.kind === types_1.SyntaxKind.SubGraphStatement;
}
exports.isSubGraphStatement = isSubGraphStatement;
function isGraph(node) {
    return node.kind === types_1.SyntaxKind.DirectedGraph || node.kind === types_1.SyntaxKind.UndirectedGraph;
}
function isNodeId(node) {
    return node.kind === types_1.SyntaxKind.NodeId;
}
exports.isNodeId = isNodeId;
function edgeStatementHasAttributes(es) {
    return es.attributes
        && es.attributes.length > 0
        && es.attributes.some(a => a.assignments && a.assignments.length > 0);
}
exports.edgeStatementHasAttributes = edgeStatementHasAttributes;
function getIdentifierText(n) {
    switch (n.kind) {
        case types_1.SyntaxKind.HtmlIdentifier:
            return n.htmlContent;
        case types_1.SyntaxKind.TextIdentifier:
            return n.text;
        case types_1.SyntaxKind.NumericIdentifier:
            return n.text;
        case types_1.SyntaxKind.QuotedTextIdentifier:
            return n.concatenation;
        default:
            return util_1.assertNever(n);
    }
}
exports.getIdentifierText = getIdentifierText;
function createCheckerError(sub) {
    return {
        source: 4,
        sub,
    };
}
//# sourceMappingURL=checker.js.map