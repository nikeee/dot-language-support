"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const checker_1 = require("./checker");
const parser_1 = require("./parser");
const binder = createBinder();
function bindSourceFile(file) {
    binder.bind(file);
}
exports.bindSourceFile = bindSourceFile;
function createBinder() {
    let parent = undefined;
    let symbolTable = undefined;
    let graphContext = 0;
    function bind(node) {
        if (!node)
            return;
        const saveParent = parent;
        const saveContext = graphContext;
        node.parent = saveParent;
        node.graphContext = saveContext;
        parent = node;
        innerBind(node);
        parent = saveParent;
        graphContext = saveContext;
    }
    function innerBind(node) {
        switch (node.kind) {
            case types_1.SyntaxKind.DirectedGraph:
            case types_1.SyntaxKind.UndirectedGraph:
                return bindGraph(node);
            case types_1.SyntaxKind.AttributeStatement:
                return bindAttributeStatement(node);
            case types_1.SyntaxKind.EdgeStatement:
                return bindEdgeStatement(node);
            case types_1.SyntaxKind.NodeStatement:
                return bindNodeStatement(node);
            case types_1.SyntaxKind.SubGraph:
                return bindSubGraph(node);
            case types_1.SyntaxKind.SubGraphStatement:
                return bindSubGraphStatement(node);
            case types_1.SyntaxKind.IdEqualsIdStatement:
                return bindIdEqualsIdStatement(node);
            case types_1.SyntaxKind.QuotedTextIdentifier:
                return bindQuotedTextIdentifier(node);
            case types_1.SyntaxKind.EdgeRhs:
                return bindEdgeRhs(node);
            case types_1.SyntaxKind.AttributeContainer:
                return bindAttributeContainer(node);
            case types_1.SyntaxKind.Assignment:
                return bindAssignment(node);
            case types_1.SyntaxKind.NormalPointDeclaration:
                return bindNormalPointDeclaration(node);
            case types_1.SyntaxKind.CompassPointDeclaration:
                return bindCompassPointDeclaration(node);
            case types_1.SyntaxKind.NodeId:
                return bindNodeId(node);
            default:
                if (node.kind >= types_1.SyntaxKind.FirstNode)
                    throw "TODO";
        }
    }
    function bindGraph(node) {
        if (node.strict) {
            graphContext |= 2;
        }
        switch (node.kind) {
            case types_1.SyntaxKind.DirectedGraph:
                graphContext |= 4;
                break;
            case types_1.SyntaxKind.UndirectedGraph:
                graphContext |= 8;
                break;
        }
        if (node.id) {
            ensureGlobalSymbol(node.id);
            bind(node.id);
        }
        ;
        if (node.strict)
            bind(node.strict);
        bindChildren(node.statements);
    }
    function bindAttributeStatement(node) {
        bindChildren(node.attributes);
        if (node.terminator)
            bind(node.terminator);
    }
    function bindEdgeStatement(node) {
        bindChildren(node.attributes);
        bindChildren(node.rhs);
        bind(node.source);
        if (node.terminator)
            bind(node.terminator);
    }
    function bindNodeStatement(node) {
        bind(node.id);
        bindChildren(node.attributes);
        if (node.terminator)
            bind(node.terminator);
    }
    function bindSubGraph(node) {
        if (node.id) {
            bind(node.id);
        }
        ;
        bindChildren(node.statements);
    }
    function bindSubGraphStatement(node) {
        bind(node.subgraph);
        if (node.terminator)
            bind(node.terminator);
    }
    function bindIdEqualsIdStatement(node) {
        bind(node.leftId);
        bind(node.rightId);
        if (node.terminator)
            bind(node.terminator);
    }
    function bindQuotedTextIdentifier(node) {
        bindChildren(node.values);
        node.concatenation = node.values.map(v => v.text).join("");
    }
    function bindEdgeRhs(node) {
        bind(node.operation);
        bind(node.target);
    }
    function bindAttributeContainer(node) {
        bindChildren(node.assignments);
    }
    function bindAssignment(node) {
        const attrContainer = node.parent;
        console.assert(!!attrContainer);
        const superParentStatement = attrContainer.parent;
        console.assert(!!superParentStatement);
        bind(node.leftId);
        let carrierIdentifier = undefined;
        switch (superParentStatement.kind) {
            case types_1.SyntaxKind.NodeStatement:
                carrierIdentifier = superParentStatement.id.id;
                break;
            case types_1.SyntaxKind.EdgeStatement:
                break;
            case types_1.SyntaxKind.SubGraphStatement:
                break;
            case types_1.SyntaxKind.AttributeStatement:
                break;
        }
        if (carrierIdentifier)
            ensureMemberSymbol(node.leftId, carrierIdentifier);
        bind(node.rightId);
        if (node.terminator)
            bind(node.terminator);
    }
    function bindNormalPointDeclaration(node) {
        bind(node.colon);
        ensureGlobalSymbol(node.id);
        bind(node.id);
        if (node.compassPt)
            bind(node.compassPt);
    }
    function bindCompassPointDeclaration(node) {
        bind(node.colon);
        if (node.compassPt)
            bind(node.compassPt);
    }
    function bindNodeId(node) {
        ensureGlobalSymbol(node.id);
        bind(node.id);
        if (node.point)
            bind(node.point);
    }
    function bindChildren(nodes) {
        for (const n of nodes)
            bind(n);
    }
    function createSymbolTable() {
        return new Map();
    }
    function ensureMemberSymbol(node, carrier) {
        if (node && carrier && parser_1.isIdentifierNode(node)) {
            const name = checker_1.getIdentifierText(node);
            if (name === undefined)
                return;
            const carrierSymbol = carrier.symbol;
            if (carrierSymbol === undefined)
                throw "carrierSymbol is undefined";
            let symbols = carrierSymbol.members;
            if (symbols === undefined)
                carrierSymbol.members = symbols = createSymbolTable();
            ensureSymbolOnTable(name, node, symbols);
            return;
        }
        console.warn("ensureSymbol called on non-identifier node");
        debugger;
    }
    function ensureGlobalSymbol(node) {
        if (node && parser_1.isIdentifierNode(node)) {
            const symbols = symbolTable;
            const name = checker_1.getIdentifierText(node);
            if (name === undefined)
                return;
            if (symbols === undefined)
                throw "symbolTable is undefined";
            ensureSymbolOnTable(name, node, symbols);
            return;
        }
        console.warn("ensureSymbol called on non-identifier node");
        debugger;
    }
    function ensureSymbolOnTable(name, node, symbols) {
        let sym = symbols.get(name);
        if (sym === undefined) {
            sym = createSymbol(name, node);
            symbols.set(name, sym);
        }
        else {
            if (!sym.references)
                sym.references = [node];
            else
                sym.references.push(node);
        }
        node.symbol = sym;
    }
    function createSymbol(name, node) {
        if (!name)
            throw "name is falsy";
        if (!node)
            throw "node is undefined or null";
        return {
            name,
            firstMention: node,
            references: undefined,
        };
    }
    return {
        bind: file => {
            symbolTable = createSymbolTable();
            const { graph } = file;
            if (graph)
                bind(graph);
            file.symbols = symbolTable;
        },
    };
}
//# sourceMappingURL=binder.js.map