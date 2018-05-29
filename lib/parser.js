"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scanner_1 = require("./scanner");
const types_1 = require("./types");
var ParsingContext;
(function (ParsingContext) {
    ParsingContext[ParsingContext["None"] = 0] = "None";
    ParsingContext[ParsingContext["StatementList"] = 1] = "StatementList";
    ParsingContext[ParsingContext["AttributeContainerList"] = 2] = "AttributeContainerList";
    ParsingContext[ParsingContext["AssignmentList"] = 3] = "AssignmentList";
    ParsingContext[ParsingContext["EdgeRhsList"] = 4] = "EdgeRhsList";
    ParsingContext[ParsingContext["QuotedTextIdentifierConcatenation"] = 5] = "QuotedTextIdentifierConcatenation";
    ParsingContext[ParsingContext["Count"] = 6] = "Count";
})(ParsingContext = exports.ParsingContext || (exports.ParsingContext = {}));
class Parser {
    constructor() {
        this.currentToken = types_1.SyntaxKind.Unknown;
        this.identifierCount = 0;
        this.scanner = new scanner_1.DefaultScanner();
        this.resetState();
    }
    resetState() {
        this.sourceText = "";
        this.scanner.setText(this.sourceText);
        this.scanner.setErrorCallback(this.scanError.bind(this));
        this.identifierCount = 0;
        this.identifiers = new Set();
        this.nodeCount = 0;
        this.diagnostics = [];
        this.currentNodeHasError = false;
        this.currentContext = ParsingContext.None;
    }
    nextToken() {
        return this.currentToken = this.scanner.scan(true);
    }
    token() {
        return this.currentToken;
    }
    getLinesFromFile(sourceText) {
        return sourceText.split(/\r?\n/);
    }
    parse(sourceText) {
        this.sourceText = sourceText;
        this.scanner.setText(this.sourceText);
        this.nextToken();
        let graph = undefined;
        if (this.token() !== types_1.SyntaxKind.EndOfFileToken) {
            graph = this.parseGraph();
            if (this.token() !== types_1.SyntaxKind.EndOfFileToken) {
                this.parseErrorAtPosition(this.scanner.tokenPos, this.scanner.text.length - 1, "Content after the end of a graph declaration is invalid.", { source: 2, sub: 1 });
            }
        }
        const result = {
            content: this.sourceText,
            graph,
            identifiers: this.identifiers,
            diagnostics: this.diagnostics,
        };
        this.resetState();
        return result;
    }
    parseGraph() {
        const strictToken = this.parseOptionalToken(types_1.SyntaxKind.StrictKeyword);
        const keyword = this.parseExpectedTokenOneOf(types_1.SyntaxKind.DigraphKeyword, [types_1.SyntaxKind.DigraphKeyword, types_1.SyntaxKind.GraphKeyword]);
        const kind = keyword === undefined || keyword.kind === types_1.SyntaxKind.DigraphKeyword
            ? types_1.SyntaxKind.DirectedGraph
            : types_1.SyntaxKind.UndirectedGraph;
        const graphStart = strictToken ? strictToken.pos : keyword.pos;
        const node = this.createNode(kind, graphStart);
        node.strict = strictToken;
        node.keyword = keyword;
        node.id = this.isIdentifier() ? this.parseIdentifier() : undefined;
        this.parseExpectedToken(types_1.SyntaxKind.OpenBraceToken);
        node.statements = this.parseList(ParsingContext.StatementList, () => this.parseStatement());
        this.parseExpectedToken(types_1.SyntaxKind.CloseBraceToken);
        return this.finishNode(node);
    }
    parseIdentifier() {
        let result;
        let escapedIdTexts = new Array();
        switch (this.token()) {
            case types_1.SyntaxKind.TextIdentifier:
                result = this.parseTextIdentifier();
                escapedIdTexts.push(result.text);
                break;
            case types_1.SyntaxKind.StringLiteral:
                result = this.parseQuotedTextIdentifierConcatenation();
                escapedIdTexts.push(...result.values.map(v => v.text));
                break;
            case types_1.SyntaxKind.HtmlIdentifier:
                result = this.parseHtmlIdentifier();
                escapedIdTexts.push(result.htmlContent);
                break;
            case types_1.SyntaxKind.NumericIdentifier:
                result = this.parseNumericIdentifier();
                escapedIdTexts.push(result.text);
                break;
            default:
                this.reportExpectedError([types_1.SyntaxKind.TextIdentifier]);
                result = this.createMissingNode(types_1.SyntaxKind.TextIdentifier);
                break;
        }
        escapedIdTexts.forEach(i => this.registerIdentifier(i));
        return result;
    }
    registerIdentifier(id) {
        this.identifierCount++;
        const has = this.identifiers.has(id);
        if (!has)
            this.identifiers.add(id);
    }
    parseTextIdentifier() {
        const node = this.createNode(types_1.SyntaxKind.TextIdentifier);
        const text = this.scanner.tokenValue;
        this.nextToken();
        if (text === undefined)
            throw "Satisfy type checker";
        node.text = text;
        return this.finishNode(node);
    }
    parseQuotedTextIdentifierConcatenation() {
        const node = this.createNode(types_1.SyntaxKind.QuotedTextIdentifier);
        node.values = this.parseList(ParsingContext.QuotedTextIdentifierConcatenation, () => this.parseQuotedTextIdentifier(), true);
        return this.finishNode(node);
    }
    parseQuotedTextIdentifier() {
        const node = this.createNode(types_1.SyntaxKind.StringLiteral);
        if (this.token() === types_1.SyntaxKind.PlusToken)
            this.nextToken();
        const text = this.scanner.tokenValue;
        this.nextToken();
        if (text === undefined)
            throw "Satisfy type checker";
        node.text = text;
        return this.finishNode(node);
    }
    isQuotedStringFollowing() {
        this.nextToken();
        return this.token() === types_1.SyntaxKind.StringLiteral;
    }
    parseHtmlIdentifier() {
        const node = this.createNode(types_1.SyntaxKind.HtmlIdentifier);
        const text = this.scanner.tokenValue;
        this.nextToken();
        if (text === undefined)
            throw "Satisfy type checker";
        node.htmlContent = text;
        return this.finishNode(node);
    }
    parseNumericIdentifier() {
        const node = this.createNode(types_1.SyntaxKind.NumericIdentifier);
        const text = this.scanner.tokenValue;
        this.nextToken();
        if (text === undefined)
            throw "Satisfy type checker";
        node.text = text;
        node.value = Number(text);
        return this.finishNode(node);
    }
    parseStatement() {
        switch (this.token()) {
            case types_1.SyntaxKind.GraphKeyword:
            case types_1.SyntaxKind.NodeKeyword:
            case types_1.SyntaxKind.EdgeKeyword:
                return this.parseAttributeStatement();
            case types_1.SyntaxKind.OpenBraceToken:
            case types_1.SyntaxKind.SubgraphKeyword:
                const subgraph = this.parseSubGraph();
                if (this.token() === types_1.SyntaxKind.SemicolonToken) {
                    const subgraphStatement = this.createNode(types_1.SyntaxKind.SubGraphStatement, subgraph.pos);
                    subgraphStatement.subgraph = subgraph;
                    subgraphStatement.terminator = this.parseExpectedToken(types_1.SyntaxKind.SemicolonToken);
                    return subgraphStatement;
                }
                if (this.isEdgeOp())
                    return this.parseEdgeStatement(subgraph);
                const subgraphStatement = this.createNode(types_1.SyntaxKind.SubGraphStatement, subgraph.pos);
                subgraphStatement.subgraph = subgraph;
                return subgraphStatement;
            default: {
                if (!this.isIdentifier)
                    debugger;
                if (this.lookAhead(() => this.isIdEqualsIdStatement())) {
                    return this.parseIdEqualsIdStatement();
                }
                const ns = this.parseNodeStatement();
                if (ns.terminator !== undefined || ns.attributes.length !== 0)
                    return ns;
                if (this.isEdgeOp())
                    return this.parseEdgeStatement(ns.id);
                return ns;
            }
        }
    }
    parseAttributeStatement() {
        switch (this.token()) {
            case types_1.SyntaxKind.GraphKeyword:
            case types_1.SyntaxKind.NodeKeyword:
            case types_1.SyntaxKind.EdgeKeyword:
                {
                    const node = this.createNode(types_1.SyntaxKind.AttributeStatement);
                    node.subject = this.parseTokenNode();
                    if (this.token() == types_1.SyntaxKind.OpenBracketToken) {
                        node.attributes = this.parseList(ParsingContext.AttributeContainerList, () => this.parseAttributeContainer());
                    }
                    else {
                        this.reportExpectedError([types_1.SyntaxKind.OpenBracketToken]);
                        const missingStatement = this.createMissingNode(types_1.SyntaxKind.AttributeStatement);
                        missingStatement.attributes = this.createNodeArray([this.createMissingNode(types_1.SyntaxKind.AttributeContainer)], this.scanner.tokenPos, this.scanner.tokenPos);
                    }
                    node.terminator = this.parseOptionalToken(types_1.SyntaxKind.SemicolonToken);
                    return this.finishNode(node);
                }
            default: throw "This should never happen";
        }
    }
    parseAttributeContainer() {
        if (this.token() !== types_1.SyntaxKind.OpenBracketToken)
            debugger;
        const node = this.createNode(types_1.SyntaxKind.AttributeContainer);
        this.parseExpectedToken(types_1.SyntaxKind.OpenBracketToken);
        if (this.isIdentifier() && this.lookAhead(() => this.isAssignmentStart())) {
            node.assignments = this.parseList(ParsingContext.AssignmentList, () => this.parseAssignment());
        }
        else {
            node.assignments = this.createEmptyArray();
        }
        this.parseExpectedToken(types_1.SyntaxKind.CloseBracketToken);
        return this.finishNode(node);
    }
    isAssignmentStart() {
        if (!this.isIdentifier)
            debugger;
        this.nextToken();
        return this.token() == types_1.SyntaxKind.EqualsToken;
    }
    parseIdEqualsIdStatement() {
        if (!this.isIdentifier)
            debugger;
        const leftIdentifier = this.parseIdentifier();
        const node = this.createNode(types_1.SyntaxKind.IdEqualsIdStatement, leftIdentifier.pos);
        node.leftId = leftIdentifier;
        if (this.token() !== types_1.SyntaxKind.EqualsToken)
            debugger;
        this.parseExpectedToken(types_1.SyntaxKind.EqualsToken);
        node.rightId = this.parseIdentifier();
        node.terminator = this.parseOptionalToken(types_1.SyntaxKind.SemicolonToken);
        return this.finishNode(node);
    }
    isIdEqualsIdStatement() {
        if (!this.isIdentifier)
            debugger;
        this.nextToken();
        return this.token() === types_1.SyntaxKind.EqualsToken;
    }
    parseNodeStatement() {
        if (!this.isIdentifier)
            debugger;
        const node = this.createNode(types_1.SyntaxKind.NodeStatement);
        node.id = this.parseNodeId();
        if (this.token() === types_1.SyntaxKind.OpenBracketToken) {
            node.attributes = this.parseList(ParsingContext.AttributeContainerList, () => this.parseAttributeContainer());
        }
        else {
            node.attributes = this.createEmptyArray();
        }
        node.terminator = this.parseOptionalToken(types_1.SyntaxKind.SemicolonToken);
        return this.finishNode(node);
    }
    parseEdgeStatement(preceedingItem) {
        console.assert(preceedingItem.kind === types_1.SyntaxKind.SubGraph || preceedingItem.kind === types_1.SyntaxKind.NodeId);
        console.assert(preceedingItem.pos !== undefined);
        if (!this.isEdgeOp())
            debugger;
        const node = this.createNode(types_1.SyntaxKind.EdgeStatement, preceedingItem.pos);
        node.source = preceedingItem;
        node.rhs = this.parseList(ParsingContext.EdgeRhsList, () => this.parseEdgeRhs());
        if (this.token() === types_1.SyntaxKind.OpenBracketToken) {
            node.attributes = this.parseList(ParsingContext.AttributeContainerList, () => this.parseAttributeContainer());
        }
        else {
            node.attributes = this.createEmptyArray();
        }
        node.terminator = this.parseOptionalToken(types_1.SyntaxKind.SemicolonToken);
        return this.finishNode(node);
    }
    parseEdgeRhs() {
        const node = this.createNode(types_1.SyntaxKind.EdgeRhs);
        const op = this.parseExpectedTokenOneOf(types_1.SyntaxKind.DirectedEdgeOp, [types_1.SyntaxKind.DirectedEdgeOp, types_1.SyntaxKind.UndirectedEdgeOp]);
        node.operation = op;
        switch (this.token()) {
            case types_1.SyntaxKind.SubgraphKeyword:
            case types_1.SyntaxKind.OpenBraceToken:
                node.target = this.parseSubGraph();
                break;
            default: {
                node.target = this.parseNodeId();
                break;
            }
        }
        return this.finishNode(node);
    }
    createMissingNode(kind) {
        const result = this.createNode(kind);
        if (isIdentifier(result.kind)) {
            switch (result.kind) {
                case types_1.SyntaxKind.QuotedTextIdentifier: {
                    const literal = this.createNode(types_1.SyntaxKind.StringLiteral);
                    literal.text = "";
                    const values = this.createNodeArray([literal], result.pos, result.pos);
                    const a = result;
                    a.values = values;
                    break;
                }
                case types_1.SyntaxKind.HtmlIdentifier:
                    result.htmlContent = "";
                    break;
                case types_1.SyntaxKind.TextIdentifier:
                case types_1.SyntaxKind.NumericIdentifier:
                    result.text = "";
                    break;
            }
        }
        return this.finishNode(result);
    }
    parseAssignment() {
        if (!this.isIdentifier)
            debugger;
        const node = this.createNode(types_1.SyntaxKind.Assignment);
        node.leftId = this.parseIdentifier();
        this.parseExpectedToken(types_1.SyntaxKind.EqualsToken);
        node.rightId = this.parseIdentifier();
        let terminator = this.parseOptionalToken(types_1.SyntaxKind.CommaToken);
        if (terminator === undefined)
            terminator = this.parseOptionalToken(types_1.SyntaxKind.SemicolonToken);
        node.terminator = terminator;
        return this.finishNode(node);
    }
    parseSubGraph() {
        console.assert(this.token() === types_1.SyntaxKind.SubgraphKeyword || this.token() === types_1.SyntaxKind.OpenBraceToken);
        const subGraph = this.parseOptionalToken(types_1.SyntaxKind.SubgraphKeyword);
        const subGraphStart = subGraph !== undefined ? subGraph.pos : undefined;
        const node = this.createNode(types_1.SyntaxKind.SubGraph, subGraphStart);
        let identifier = subGraph !== undefined && this.isIdentifier()
            ? this.parseIdentifier()
            : undefined;
        node.id = identifier;
        this.parseExpectedToken(types_1.SyntaxKind.OpenBraceToken);
        node.statements = this.parseList(ParsingContext.StatementList, () => this.parseStatement());
        this.parseExpectedToken(types_1.SyntaxKind.CloseBraceToken);
        return this.finishNode(node);
    }
    parseNodeId() {
        if (!this.isIdentifier)
            debugger;
        const node = this.createNode(types_1.SyntaxKind.NodeId);
        node.id = this.parseIdentifier();
        node.point = this.token() === types_1.SyntaxKind.ColonToken
            ? this.parsePointDeclaration()
            : undefined;
        return this.finishNode(node);
    }
    parseCompassPointDeclaration() {
        console.assert(this.token() === types_1.SyntaxKind.ColonToken);
        const node = this.createNode(types_1.SyntaxKind.CompassPointDeclaration);
        node.colon = this.parseTokenNode();
        node.compassPt = this.parseTokenNode();
        return this.finishNode(node);
    }
    parseNormalPointDeclaration() {
        console.assert(this.token() === types_1.SyntaxKind.ColonToken);
        const node = this.createNode(types_1.SyntaxKind.NormalPointDeclaration);
        node.colon = this.parseTokenNode();
        node.id = this.parseIdentifier();
        node.compassPt = this.token() === types_1.SyntaxKind.ColonToken
            ? this.parseCompassPointDeclaration()
            : undefined;
        return this.finishNode(node);
    }
    parsePointDeclaration() {
        console.assert(this.token() === types_1.SyntaxKind.ColonToken);
        if (this.lookAhead(() => this.isCompassPoint()))
            return this.parseCompassPointDeclaration();
        return this.parseNormalPointDeclaration();
    }
    isCompassPoint() {
        console.assert(this.token() === types_1.SyntaxKind.ColonToken);
        if (this.token() !== types_1.SyntaxKind.ColonToken)
            return false;
        this.nextToken();
        return this.isCompassPointKind(this.token());
    }
    parseList(context, parseElement, atLeastOne = false) {
        const saveParsingContext = this.currentContext;
        this.currentContext |= 1 << context;
        let isListTerminated = atLeastOne ? false : this.isListTerminator(context);
        const startPos = this.scanner.startPos;
        const elements = new Array();
        while (!isListTerminated) {
            if (this.isListElement(context, false)) {
                const element = parseElement();
                elements.push(element);
                isListTerminated = this.isListTerminator(context);
                continue;
            }
            if (this.abortListParsing(context))
                break;
        }
        this.currentContext = saveParsingContext;
        return this.createNodeArray(elements, startPos);
    }
    getContextParseError(context) {
        switch (context) {
            case ParsingContext.StatementList:
                return "Assignment, node definition, graph/node/edge attribute or edge definition expected.";
            case ParsingContext.AssignmentList:
                return "Assignment expected.";
            case ParsingContext.EdgeRhsList:
                return "Edge operation expected.";
            case ParsingContext.QuotedTextIdentifierConcatenation:
                return "Quoted identifier expected";
            case ParsingContext.AttributeContainerList:
                return "Attribute marker expected.";
            case ParsingContext.None:
                return "Wat, no parsing context";
            case ParsingContext.Count:
                return "Wat, 'Count' parsing context";
        }
        return "Error parsing list";
    }
    isInSomeParsingContext() {
        for (let ctx = 0; ctx < ParsingContext.Count; ctx++) {
            if (this.currentContext & (1 << ctx)) {
                if (this.isListElement(ctx, true) || this.isListTerminator(ctx)) {
                    return true;
                }
            }
        }
        return false;
    }
    abortListParsing(context) {
        this.parseErrorAtCurrentToken(this.getContextParseError(context), 2);
        if (this.isInSomeParsingContext()) {
            return true;
        }
        this.nextToken();
        return false;
    }
    isListElement(context, inErrorRecovery) {
        switch (context) {
            case ParsingContext.AssignmentList:
                return this.isIdentifier();
            case ParsingContext.AttributeContainerList:
                return this.token() === types_1.SyntaxKind.OpenBracketToken;
            case ParsingContext.EdgeRhsList:
                return this.token() === types_1.SyntaxKind.DirectedEdgeOp
                    || this.token() === types_1.SyntaxKind.UndirectedEdgeOp;
            case ParsingContext.QuotedTextIdentifierConcatenation:
                return this.token() === types_1.SyntaxKind.StringLiteral
                    || this.token() === types_1.SyntaxKind.PlusToken;
            case ParsingContext.StatementList:
                return this.isIdentifier()
                    || this.token() === types_1.SyntaxKind.SubgraphKeyword
                    || this.token() === types_1.SyntaxKind.OpenBraceToken
                    || this.token() === types_1.SyntaxKind.GraphKeyword
                    || this.token() === types_1.SyntaxKind.EdgeKeyword
                    || this.token() === types_1.SyntaxKind.NodeKeyword;
            default: throw "This should never happen";
        }
    }
    isListTerminator(context) {
        const token = this.token();
        if (token === types_1.SyntaxKind.EndOfFileToken)
            return true;
        switch (context) {
            case ParsingContext.StatementList:
                return token === types_1.SyntaxKind.CloseBraceToken;
            case ParsingContext.AttributeContainerList:
                return token !== types_1.SyntaxKind.OpenBracketToken;
            case ParsingContext.AssignmentList:
                return token === types_1.SyntaxKind.CloseBracketToken;
            case ParsingContext.EdgeRhsList:
                return token !== types_1.SyntaxKind.DirectedEdgeOp && token !== types_1.SyntaxKind.UndirectedEdgeOp;
            case ParsingContext.QuotedTextIdentifierConcatenation:
                return token !== types_1.SyntaxKind.PlusToken;
            default: throw "Unsupported parsing context";
        }
    }
    createEmptyArray() {
        const startPos = this.scanner.startPos;
        const elements = new Array();
        return this.createNodeArray(elements, startPos);
    }
    finishNode(node, end) {
        node.end = end === undefined ? this.scanner.startPos : end;
        if (this.currentNodeHasError) {
            this.currentNodeHasError = false;
            node.flags |= 2;
        }
        return node;
    }
    createNode(kind, pos) {
        this.nodeCount++;
        const p = pos !== undefined && pos >= 0 ? pos : this.scanner.startPos;
        if (isNodeKind(kind) || kind === types_1.SyntaxKind.Unknown)
            return newNode(kind, p, p);
        return isIdentifier(kind)
            ? newIdentifier(kind, p, p)
            : newToken(kind, p, p);
    }
    createNodeArray(elements, pos, end) {
        const length = elements.length;
        const array = (length >= 1 && length <= 4 ? elements.slice() : elements);
        array.pos = pos;
        array.end = end === undefined ? this.scanner.startPos : end;
        return array;
    }
    parseTokenNode() {
        const node = this.createNode(this.token());
        this.nextToken();
        return this.finishNode(node);
    }
    getLastError(diagnostics) {
        return diagnostics && diagnostics.length > 0 ? diagnostics[diagnostics.length - 1] : undefined;
    }
    parseErrorAtPosition(start, end, message, code) {
        const ds = this.diagnostics;
        const lastError = this.getLastError(ds);
        if (!lastError || start !== lastError.start) {
            ds.push({
                category: types_1.DiagnosticCategory.Error,
                start,
                end,
                message,
                code,
            });
        }
        this.currentNodeHasError = true;
    }
    parseErrorAtCurrentToken(message, sub) {
        const error = {
            source: 2,
            sub,
        };
        return this.parseErrorAtPosition(this.scanner.tokenPos, this.scanner.pos, message, error);
    }
    scanError(message, category, sub, length) {
        const errorPos = this.scanner.pos;
        const err = {
            source: 1,
            sub,
        };
        this.parseErrorAtPosition(errorPos, errorPos + length, message, err);
    }
    reportExpectedError(expectedKinds) {
        const found = this.isIdentifier()
            ? "identifier"
            : this.token() === types_1.SyntaxKind.EndOfFileToken
                ? "end of file"
                : `"${scanner_1.getTokenAsText(this.token())}"`;
        const expected = expectedKinds.map(k => {
            if (isIdentifier(k))
                return "identifier";
            else if (k === types_1.SyntaxKind.EndOfFileToken)
                return "end of file";
            return `"${scanner_1.getTokenAsText(k)}"`;
        });
        const lastExpected = expected.pop();
        const expectedJoined = expected.join(", ");
        const msg = expected.length > 0
            ? `Expected ${expectedJoined} or ${lastExpected} but found ${found} instead.`
            : `Expected ${lastExpected} but found ${found} instead.`;
        this.parseErrorAtCurrentToken(msg, 0);
    }
    parseExpectedOneOf(...kinds) {
        if (kinds.length < 2) {
            console.assert(false);
            debugger;
        }
        for (const kind of kinds) {
            if (this.token() === kind) {
                this.nextToken();
                return true;
            }
        }
        this.reportExpectedError(kinds);
        return false;
    }
    parseExpectedTokenOneOf(fallback, kinds) {
        if (kinds.length < 2) {
            console.assert(false);
            debugger;
        }
        for (const kind of kinds) {
            if (this.token() === kind) {
                const node = this.createNode(this.token());
                this.nextToken();
                return this.finishNode(node);
            }
        }
        this.reportExpectedError(kinds);
        return this.createMissingNode(fallback);
    }
    parseExpectedToken(kind) {
        const tokenNode = this.parseOptionalToken(kind);
        if (tokenNode !== undefined)
            return tokenNode;
        this.reportExpectedError([kind]);
        return this.createMissingNode(kind);
    }
    parseExpected(kind) {
        const res = this.parseOptional(kind);
        if (!res)
            this.reportExpectedError([kind]);
        return res;
    }
    parseOptionalToken(t) {
        if (this.token() === t) {
            return this.parseTokenNode();
        }
        return undefined;
    }
    parseOptional(t) {
        if (this.token() === t) {
            this.nextToken();
            return true;
        }
        return false;
    }
    isEdgeOp() {
        switch (this.token()) {
            case types_1.SyntaxKind.DirectedEdgeOp:
            case types_1.SyntaxKind.UndirectedEdgeOp:
                return true;
            default:
                return false;
        }
    }
    isIdentifier() {
        switch (this.token()) {
            case types_1.SyntaxKind.TextIdentifier:
            case types_1.SyntaxKind.StringLiteral:
            case types_1.SyntaxKind.HtmlIdentifier:
                return true;
            default:
                return false;
        }
    }
    isCompassPointKind(kind) {
        return kind >= types_1.SyntaxKind.CompassCenterToken && kind <= types_1.SyntaxKind.CompassEnd;
    }
    speculationHelper(callback, isLookAhead) {
        const saveToken = this.token();
        const saveDiagnosticsLength = this.diagnostics.length;
        const result = isLookAhead
            ? this.scanner.lookAhead(callback)
            : this.scanner.tryScan(callback);
        if (!result || isLookAhead) {
            this.currentToken = saveToken;
            this.diagnostics.length = saveDiagnosticsLength;
        }
        return result;
    }
    lookAhead(callback) {
        return this.speculationHelper(callback, true);
    }
    tryParse(callback) {
        return this.speculationHelper(callback, false);
    }
}
exports.Parser = Parser;
function newNode(kind, pos, end) {
    return {
        kind,
        flags: 0,
        end,
        pos,
        parent: undefined,
    };
}
const newIdentifier = newNode;
const newToken = newNode;
function isNodeKind(kind) {
    return kind >= types_1.SyntaxKind.FirstNode;
}
function isIdentifier(kind) {
    return kind === types_1.SyntaxKind.HtmlIdentifier
        || kind === types_1.SyntaxKind.TextIdentifier
        || kind === types_1.SyntaxKind.QuotedTextIdentifier;
}
exports.isIdentifier = isIdentifier;
function isIdentifierNode(node) {
    return isIdentifier(node.kind);
}
exports.isIdentifierNode = isIdentifierNode;
//# sourceMappingURL=parser.js.map