"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const _1 = require("../");
function getStart(sourceFile, node) {
    return getTokenPosOfNode(sourceFile, node);
}
exports.getStart = getStart;
function getTokenPosOfNode(sourceFile, node) {
    if (nodeIsMissing(node))
        return node.pos;
    return _1.skipTrivia(sourceFile.content, node.pos);
}
function nodeIsMissing(node) {
    return node === undefined
        ? true
        : node.pos === node.end && node.pos >= 0 && node.kind !== types_1.SyntaxKind.EndOfFileToken;
}
function syntaxNodesToRanges(doc, sourceFile, nodes) {
    return nodes.map(node => syntaxNodeToRange(doc, sourceFile, node));
}
exports.syntaxNodesToRanges = syntaxNodesToRanges;
function syntaxNodeToRange(doc, sourceFile, node) {
    const start = getStart(sourceFile, node);
    return {
        start: doc.positionAt(start),
        end: doc.positionAt(node.end),
    };
}
exports.syntaxNodeToRange = syntaxNodeToRange;
function escapeIdentifierText(text) {
    if (text === "")
        return quote("");
    if (text.includes("\"") || text.includes("\n")) {
        const esc = text
            .replace(/"/, "\\\"")
            .replace(/\n/, "\\\n");
        return quote(esc);
    }
    const ch = text.charCodeAt(0);
    if (!_1.isIdentifierStart(ch) || text.includes(" "))
        return quote(text);
    return text;
}
exports.escapeIdentifierText = escapeIdentifierText;
const quote = (s) => "\"" + s + "\"";
function assertNever(n) {
    throw new Error("Never assertion");
}
exports.assertNever = assertNever;
//# sourceMappingURL=util.js.map