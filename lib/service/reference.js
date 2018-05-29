"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("../");
const checker_1 = require("../checker");
const util_1 = require("./util");
function findReferences(doc, sourceFile, position, context) {
    if (!sourceFile.symbols)
        throw "sourceFile is not bound";
    const g = sourceFile.graph;
    if (!g)
        return [];
    const offset = doc.offsetAt(position);
    const node = checker_1.findNodeAtOffset(g, offset);
    if (!node)
        return [];
    if (_1.isIdentifierNode(node)) {
        const nodeSymbol = node.symbol;
        if (!nodeSymbol)
            throw "node.symbol is not bound";
        const refs = nodeSymbol.references || [];
        let symbolRefs;
        if (context.includeDeclaration) {
            symbolRefs = [nodeSymbol.firstMention, ...refs];
        }
        else {
            if (nodeSymbol.firstMention === node) {
                symbolRefs = refs;
            }
            else {
                symbolRefs = [
                    nodeSymbol.firstMention,
                    ...refs.filter(r => r !== node),
                ];
            }
        }
        const ranges = util_1.syntaxNodesToRanges(doc, sourceFile, symbolRefs);
        const uri = doc.uri;
        return ranges.map(range => {
            return { uri, range };
        });
    }
    debugger;
    return [];
}
exports.findReferences = findReferences;
function findDefinition(doc, sourceFile, position) {
    if (!sourceFile.symbols)
        throw "sourceFile is not bound";
    const g = sourceFile.graph;
    if (!g)
        return undefined;
    const offset = doc.offsetAt(position);
    const node = checker_1.findNodeAtOffset(g, offset);
    if (!node)
        return undefined;
    if (_1.isIdentifierNode(node)) {
        const nodeSymbol = node.symbol;
        if (!nodeSymbol)
            throw "node.symbol is not bound";
        const refs = nodeSymbol.references || [];
        let symbolRefs;
        const firstMention = nodeSymbol.firstMention;
        if (!firstMention)
            return undefined;
        const range = util_1.syntaxNodeToRange(doc, sourceFile, firstMention);
        return { uri: doc.uri, range };
    }
    debugger;
    return undefined;
}
exports.findDefinition = findDefinition;
//# sourceMappingURL=reference.js.map