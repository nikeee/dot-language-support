import { DefaultScanner, getTokenAsText, type Scanner } from "./scanner.js";
import { assertNever } from "./service/util.js";
import {
	type Assignment,
	type AssignmentSeparator,
	type AttributeContainer,
	type AttributeStatement,
	type CompassPortDeclaration,
	DiagnosticCategory,
	type DiagnosticMessage,
	type EdgeRhs,
	type EdgeStatement,
	type ErrorCode,
	ErrorSource,
	type Graph,
	type HtmlIdentifier,
	type IdEqualsIdStatement,
	type Identifier,
	type MutableSyntaxNodeArray,
	type NodeId,
	type NodeStatement,
	type NormalPortDeclaration,
	type NumericIdentifier,
	ParseError,
	type PortDeclaration,
	type QuotedTextIdentifier,
	type ScanError,
	type SourceFile,
	type Statement,
	type StringLiteral,
	type SubGraph,
	type SubGraphStatement,
	SyntaxKind,
	type SyntaxNode,
	type SyntaxNodeArray,
	SyntaxNodeFlags,
	type TextIdentifier,
	type Token,
} from "./types";

export enum ParsingContext {
	None = 0,
	StatementList = 1,
	AttributeContainerList = 2,
	AssignmentList = 3,
	EdgeRhsList = 4,
	QuotedTextIdentifierConcatenation = 5,

	Count = 6, // Number of parsing contexts
}

export class Parser {
	currentToken: SyntaxKind = SyntaxKind.Unknown;
	nodeCount: number;
	identifiers: Set<string>;
	identifierCount = 0;
	sourceText: string;
	scanner: Scanner = new DefaultScanner();
	currentNodeHasError: boolean;
	currentContext: ParsingContext;

	diagnostics: DiagnosticMessage[]; // TODO

	constructor() {
		this.#resetState();
	}

	#resetState() {
		this.sourceText = "";
		this.scanner.setText(this.sourceText);
		this.scanner.setErrorCallback(this.#scanError.bind(this));
		this.identifierCount = 0;
		this.identifiers = new Set<string>();
		this.nodeCount = 0;
		this.diagnostics = [];
		this.currentNodeHasError = false;
		this.currentContext = ParsingContext.None;
	}

	#nextToken(): SyntaxKind {
		this.currentToken = this.scanner.scan(true);
		return this.currentToken;
	}
	#token(): SyntaxKind {
		return this.currentToken;
	}

	#getLinesFromFile(sourceText: string): string[] {
		return sourceText.split(/\r?\n/);
	}

	parse(sourceText: string): SourceFile {
		this.sourceText = sourceText;
		this.scanner.setText(this.sourceText);

		// preparing the scanner
		this.#nextToken();

		let graph: Graph | undefined;
		if (this.#token() !== SyntaxKind.EndOfFileToken) {
			// Parsing root node
			graph = this.#parseGraph();

			if (this.#token() !== SyntaxKind.EndOfFileToken) {
				this.#parseErrorAtPosition(
					this.scanner.tokenPos,
					this.scanner.text.length - 1,
					"Content after the end of a graph declaration is invalid.",
					{ source: ErrorSource.Parse, sub: ParseError.TrailingData },
				);
			}
		}

		const result = {
			content: this.sourceText,
			graph,
			identifiers: this.identifiers,
			diagnostics: this.diagnostics,
		};

		this.#resetState();
		return result;
	}

	#parseGraph(): Graph {
		const strictToken = this.#parseOptionalToken(SyntaxKind.StrictKeyword);

		const keyword = this.#parseExpectedTokenOneOf(SyntaxKind.DigraphKeyword, [
			SyntaxKind.DigraphKeyword,
			SyntaxKind.GraphKeyword,
		]);
		const kind =
			keyword === undefined || keyword.kind === SyntaxKind.DigraphKeyword
				? SyntaxKind.DirectedGraph
				: SyntaxKind.UndirectedGraph;

		const graphStart = strictToken ? strictToken.pos : keyword.pos;
		const node = this.#createNode(kind, graphStart) as Graph;
		node.strict = strictToken;
		node.keyword = keyword;
		node.id = this.#isIdentifier() ? this.#parseIdentifier() : undefined;

		/* node.openBrace = */ this.#parseExpectedToken(SyntaxKind.OpenBraceToken);

		node.statements = this.#parseList(ParsingContext.StatementList, () =>
			this.#parseStatement(),
		);

		/* node.closeBrace = */ this.#parseExpectedToken(SyntaxKind.CloseBraceToken);

		return this.#finishNode(node);
	}
	#parseIdentifier(): Identifier {
		let result: Identifier;
		const escapedIdTexts: string[] = [];
		switch (this.#token()) {
			case SyntaxKind.TextIdentifier:
				result = this.#parseTextIdentifier();
				escapedIdTexts.push(result.text);
				break;
			case SyntaxKind.StringLiteral:
				result = this.#parseQuotedTextIdentifierConcatenation();
				escapedIdTexts.push(...result.values.map(v => v.text));
				break;
			case SyntaxKind.HtmlIdentifier:
				result = this.#parseHtmlIdentifier();
				escapedIdTexts.push(result.htmlContent);
				break;
			case SyntaxKind.NumericIdentifier:
				result = this.#parseNumericIdentifier();
				escapedIdTexts.push(result.text);
				break;
			default:
				this.#reportExpectedError([SyntaxKind.TextIdentifier]);
				result = this.#createMissingNode<TextIdentifier>(SyntaxKind.TextIdentifier);
				break;
		}

		for (const i of escapedIdTexts) {
			this.#registerIdentifier(i);
		}

		return result;
	}

	#registerIdentifier(id: string): void {
		this.identifierCount++;
		const has = this.identifiers.has(id);
		if (!has) this.identifiers.add(id);
		// return id;
	}

	#parseTextIdentifier(): TextIdentifier {
		const node = this.#createNode(SyntaxKind.TextIdentifier) as TextIdentifier;
		const text = this.scanner.tokenValue;
		this.#nextToken();

		if (text === undefined) throw "Satisfy type checker";

		node.text = text;
		return this.#finishNode(node);
	}
	#parseQuotedTextIdentifierConcatenation(): QuotedTextIdentifier {
		const node = this.#createNode(SyntaxKind.QuotedTextIdentifier) as QuotedTextIdentifier;

		node.values = this.#parseList(
			ParsingContext.QuotedTextIdentifierConcatenation,
			() => this.#parseQuotedTextIdentifier(),
			/* at least one */ true,
		);

		return this.#finishNode(node);
	}
	#parseQuotedTextIdentifier(): StringLiteral {
		const node = this.#createNode(SyntaxKind.StringLiteral) as StringLiteral;

		// Quoted strings can be concatenated
		// If we have a + as the next token and the token after that is a quoted string
		// -> consume plus token, so the rest can be handled by the list parsing
		if (this.#token() === SyntaxKind.PlusToken) this.#nextToken();

		const text = this.scanner.tokenValue;
		this.#nextToken();

		if (text === undefined) throw "Satisfy type checker";
		node.text = text;
		return this.#finishNode(node);
	}
	#isQuotedStringFollowing(): boolean {
		this.#nextToken();
		return this.#token() === SyntaxKind.StringLiteral;
	}
	#parseHtmlIdentifier(): HtmlIdentifier {
		const node = this.#createNode(SyntaxKind.HtmlIdentifier) as HtmlIdentifier;
		const text = this.scanner.tokenValue;
		this.#nextToken();

		if (text === undefined) throw "Satisfy type checker";

		node.htmlContent = text;
		return this.#finishNode(node);
	}
	#parseNumericIdentifier(): NumericIdentifier {
		const node = this.#createNode(SyntaxKind.NumericIdentifier) as NumericIdentifier;
		const text = this.scanner.tokenValue;
		this.#nextToken();

		if (text === undefined) throw "Satisfy type checker";

		node.text = text;
		node.value = Number(text);
		return this.#finishNode(node);
	}

	#parseStatement(): Statement {
		switch (this.#token()) {
			case SyntaxKind.GraphKeyword:
			case SyntaxKind.NodeKeyword:
			case SyntaxKind.EdgeKeyword:
				return this.#parseAttributeStatement();

			case SyntaxKind.OpenBraceToken:
			case SyntaxKind.SubgraphKeyword: {
				// [ subgraph [ ID ] ] '{' stmt_list '}'
				// -> subgraph can start with "subgraph" or "{"

				const subgraph = this.#parseSubGraph();

				// However, a subgraph can also be the start of an EdgeStatement
				// If the sub graph has been terminated, we cannot have an edge op following

				if (this.#token() === SyntaxKind.SemicolonToken) {
					const subgraphStatement = this.#createNode(
						SyntaxKind.SubGraphStatement,
						subgraph.pos,
					) as SubGraphStatement;
					subgraphStatement.subgraph = subgraph;
					subgraphStatement.terminator = this.#parseExpectedToken(
						SyntaxKind.SemicolonToken,
					);
					return this.#finishNode(subgraphStatement);
				}

				// if there was an edge op, we actually have an EdgeStatement, not a SubGraphStatement
				// TODO: May refactor to use lookAhead
				if (this.#isEdgeOp()) return this.#parseEdgeStatement(subgraph);

				const subgraphStatement = this.#createNode(
					SyntaxKind.SubGraphStatement,
					subgraph.pos,
				) as SubGraphStatement;
				subgraphStatement.subgraph = subgraph;
				return this.#finishNode(subgraphStatement);
			}
			default: {
				if (!this.#isIdentifier) debugger;

				// if (this.isIdentifier()) {

				// Check if it's an "ID '=' ID" using look-ahead
				if (this.#lookAhead(() => this.#isIdEqualsIdStatement())) {
					return this.#parseIdEqualsIdStatement();
				}

				// TODO: May refactor to use lookAhead
				const ns = this.#parseNodeStatement();

				// If the parsed node statement has been terminated or attributes assigned
				// -> there cannot be a following edge op
				if (ns.terminator !== undefined || ns.attributes.length !== 0) return ns;

				if (this.#isEdgeOp()) return this.#parseEdgeStatement(ns.id);

				return ns;
				// }
			}
		}
	}

	#parseAttributeStatement(): AttributeStatement {
		switch (this.#token()) {
			case SyntaxKind.GraphKeyword:
			case SyntaxKind.NodeKeyword:
			case SyntaxKind.EdgeKeyword: {
				const node = this.#createNode(SyntaxKind.AttributeStatement) as AttributeStatement;
				node.subject = this.#parseTokenNode();

				// node.attributes is not optional because we have to have an opening bracket
				if (this.#token() === SyntaxKind.OpenBracketToken) {
					node.attributes = this.#parseList(ParsingContext.AttributeContainerList, () =>
						this.#parseAttributeContainer(),
					);
				} else {
					// TODO: Is this correct?

					this.#reportExpectedError([SyntaxKind.OpenBracketToken]);

					// TODO: Set error flag
					const missingStatement = this.#createMissingNode<AttributeStatement>(
						SyntaxKind.AttributeStatement,
					);
					missingStatement.attributes = this.#createNodeArray(
						[this.#createMissingNode(SyntaxKind.AttributeContainer)],
						this.scanner.tokenPos,
						this.scanner.tokenPos,
					);
				}

				node.terminator = this.#parseOptionalToken(SyntaxKind.SemicolonToken);
				return this.#finishNode(node);
			}
			default:
				throw "This should never happen";
		}
	}

	#parseAttributeContainer(): AttributeContainer {
		if (this.#token() !== SyntaxKind.OpenBracketToken) debugger; //console.assert(this.token() === SyntaxKind.OpenBracketToken);

		const node = this.#createNode(SyntaxKind.AttributeContainer) as AttributeContainer;

		node.openBracket = this.#parseExpectedToken(SyntaxKind.OpenBracketToken);

		if (this.#isIdentifier() && this.#lookAhead(() => this.#isAssignmentStart())) {
			node.assignments = this.#parseList(ParsingContext.AssignmentList, () =>
				this.#parseAssignment(),
			);
		} else {
			// The container can also be empty, we want to create an empty array here; TODO: Why?
			node.assignments = this.#createEmptyArray();
		}

		node.closeBracket = this.#parseExpectedToken(SyntaxKind.CloseBracketToken);

		return this.#finishNode(node);
	}

	#isAssignmentStart(): boolean {
		if (!this.#isIdentifier) debugger; // console.assert(this.isIdentifier());

		this.#nextToken();
		return this.#token() === SyntaxKind.EqualsToken;
	}

	#parseIdEqualsIdStatement(): IdEqualsIdStatement {
		if (!this.#isIdentifier) debugger; // console.assert(this.isIdentifier());

		const leftIdentifier = this.#parseIdentifier();

		const node = this.#createNode(
			SyntaxKind.IdEqualsIdStatement,
			leftIdentifier.pos,
		) as IdEqualsIdStatement;
		node.leftId = leftIdentifier;

		if (this.#token() !== SyntaxKind.EqualsToken) debugger; //console.assert(this.token() === SyntaxKind.EqualsToken);

		/* node.equalsToken = */ this.#parseExpectedToken(SyntaxKind.EqualsToken);

		node.rightId = this.#parseIdentifier();

		node.terminator = this.#parseOptionalToken(SyntaxKind.SemicolonToken);

		return this.#finishNode(node);
	}

	#isIdEqualsIdStatement(): boolean {
		if (!this.#isIdentifier) debugger; // console.assert(this.isIdentifier());

		// TODO: May re-use isAssignmentStart
		this.#nextToken();
		return this.#token() === SyntaxKind.EqualsToken;
	}

	#parseNodeStatement(): NodeStatement {
		if (!this.#isIdentifier) debugger; // console.assert(this.isIdentifier());

		const node = this.#createNode(SyntaxKind.NodeStatement) as NodeStatement;

		node.id = this.#parseNodeId();

		if (this.#token() === SyntaxKind.OpenBracketToken) {
			node.attributes = this.#parseList(ParsingContext.AttributeContainerList, () =>
				this.#parseAttributeContainer(),
			);
		} else {
			// The container can also be empty, we want to create an empty array here; TODO: Why?
			node.attributes = this.#createEmptyArray();
		}

		node.terminator = this.#parseOptionalToken(SyntaxKind.SemicolonToken);

		return this.#finishNode(node);
	}

	#parseEdgeStatement(precedingItem: SubGraph | NodeId): EdgeStatement {
		console.assert(
			precedingItem.kind === SyntaxKind.SubGraph || precedingItem.kind === SyntaxKind.NodeId,
		);
		console.assert(precedingItem.pos !== undefined);

		if (!this.#isEdgeOp()) debugger; // console.assert(this.isEdgeOp());

		const node = this.#createNode(SyntaxKind.EdgeStatement, precedingItem.pos) as EdgeStatement;
		node.source = precedingItem;

		// TODO: Check edge ops in directed and undirected graphs via flags
		node.rhs = this.#parseList(ParsingContext.EdgeRhsList, () => this.#parseEdgeRhs());

		// Check if we have some following attributes
		if (this.#token() === SyntaxKind.OpenBracketToken) {
			node.attributes = this.#parseList(ParsingContext.AttributeContainerList, () =>
				this.#parseAttributeContainer(),
			);
		} else {
			// The container can also be empty, we want to create an empty array here; TODO: Why?
			node.attributes = this.#createEmptyArray();
		}

		node.terminator = this.#parseOptionalToken(SyntaxKind.SemicolonToken);

		return this.#finishNode(node);
	}

	#parseEdgeRhs(): EdgeRhs {
		const node = this.#createNode(SyntaxKind.EdgeRhs) as EdgeRhs;

		const op = this.#parseExpectedTokenOneOf(SyntaxKind.DirectedEdgeOp, [
			SyntaxKind.DirectedEdgeOp,
			SyntaxKind.UndirectedEdgeOp,
		]);
		node.operation = op as
			| Token<SyntaxKind.DirectedEdgeOp>
			| Token<SyntaxKind.UndirectedEdgeOp>;

		switch (this.#token()) {
			case SyntaxKind.SubgraphKeyword:
			case SyntaxKind.OpenBraceToken:
				node.target = this.#parseSubGraph();
				break;
			default: {
				// if (!this.isIdentifier()) throw "TODO: Parse error handling";
				node.target = this.#parseNodeId();
				break;
			}
		}

		return this.#finishNode(node);
	}

	#createMissingNode<T extends SyntaxNode>(
		kind: T["kind"] /* , reportAtCurrentPosition: boolean, diagnosticMessage: DiagnosticMessage, arg0?: any */,
	): T {
		// if (reportAtCurrentPosition) {
		// 	this.parseErrorAtPosition(scanner.getStartPos(), 0, diagnosticMessage, arg0);
		// } else {
		// 	this.parseErrorAtCurrentToken(diagnosticMessage, arg0);
		// }

		const result = this.#createNode(kind) as T;

		// TODO: Enhance this, this seems wrong
		if (isIdentifierNode(result)) {
			switch (result.kind) {
				case SyntaxKind.QuotedTextIdentifier: {
					const literal = this.#createNode(SyntaxKind.StringLiteral) as StringLiteral;
					literal.text = "";
					const values = this.#createNodeArray([literal], result.pos, result.pos);
					result.values = values;
					break;
				}
				case SyntaxKind.HtmlIdentifier:
					result.htmlContent = "";
					break;
				case SyntaxKind.TextIdentifier:
				case SyntaxKind.NumericIdentifier:
					result.text = "";
					break;
			}
		}

		return this.#finishNode(result) as T;
	}

	#parseAssignment(): Assignment {
		if (!this.#isIdentifier) debugger; // console.assert(this.isIdentifier());

		const node = this.#createNode(SyntaxKind.Assignment) as Assignment;

		node.leftId = this.#parseIdentifier();

		/* node.equalsToken = */ this.#parseExpectedToken(SyntaxKind.EqualsToken);

		node.rightId = this.#parseIdentifier();

		let terminator: AssignmentSeparator | undefined = this.#parseOptionalToken(
			SyntaxKind.CommaToken,
		);
		if (terminator === undefined)
			terminator = this.#parseOptionalToken(SyntaxKind.SemicolonToken);
		node.terminator = terminator;

		return this.#finishNode(node);
	}

	#parseSubGraph(): SubGraph {
		// subgraph : [ subgraph [ ID ] ] '{' stmt_list '}'
		console.assert(
			this.#token() === SyntaxKind.SubgraphKeyword ||
				this.#token() === SyntaxKind.OpenBraceToken,
		);

		const subGraph = this.#parseOptionalToken(SyntaxKind.SubgraphKeyword);

		const subGraphStart = subGraph !== undefined ? subGraph.pos : undefined;
		const node = this.#createNode(SyntaxKind.SubGraph, subGraphStart) as SubGraph;

		const identifier =
			subGraph !== undefined && this.#isIdentifier() ? this.#parseIdentifier() : undefined;

		node.id = identifier;

		/* node.openBrace = */ this.#parseExpectedToken(SyntaxKind.OpenBraceToken);

		node.statements = this.#parseList(ParsingContext.StatementList, () =>
			this.#parseStatement(),
		);

		/* node.closeBrace = */ this.#parseExpectedToken(SyntaxKind.CloseBraceToken);

		return this.#finishNode(node);
	}

	#parseNodeId(): NodeId {
		if (!this.#isIdentifier) debugger; // console.assert(this.isIdentifier());

		const node = this.#createNode(SyntaxKind.NodeId) as NodeId;

		node.id = this.#parseIdentifier();

		node.port =
			this.#token() === SyntaxKind.ColonToken ? this.#parsePortDeclaration() : undefined;

		return this.#finishNode(node);
	}

	#parseCompassPortDeclaration(): CompassPortDeclaration {
		console.assert(this.#token() === SyntaxKind.ColonToken);

		const node = this.#createNode(SyntaxKind.CompassPortDeclaration) as CompassPortDeclaration;

		// TODO: compass points are just identifiers -> parse them as identifiers and set a flag for being a compass point?
		node.colon = this.#parseTokenNode();
		node.compassPt = this.#parseTokenNode();

		return this.#finishNode(node);
	}

	#parseNormalPortDeclaration(): NormalPortDeclaration {
		console.assert(this.#token() === SyntaxKind.ColonToken);

		const node = this.#createNode(SyntaxKind.NormalPortDeclaration) as NormalPortDeclaration;

		node.colon = this.#parseTokenNode();
		node.id = this.#parseIdentifier();
		node.compassPt =
			this.#token() === SyntaxKind.ColonToken
				? this.#parseCompassPortDeclaration()
				: undefined;

		return this.#finishNode(node);
	}

	#parsePortDeclaration(): PortDeclaration {
		console.assert(this.#token() === SyntaxKind.ColonToken);

		if (this.#lookAhead(() => this.#isCompassPort()))
			return this.#parseCompassPortDeclaration();
		return this.#parseNormalPortDeclaration();
	}

	#isCompassPort() {
		console.assert(this.#token() === SyntaxKind.ColonToken);

		if (this.#token() !== SyntaxKind.ColonToken) return false;

		this.#nextToken();
		return this.#isCompassPortKind(this.#token());
	}

	#parseList<T extends SyntaxNode>(
		context: ParsingContext,
		parseElement: () => T,
		atLeastOne = false,
	): SyntaxNodeArray<T> {
		const saveParsingContext = this.currentContext;
		this.currentContext |= 1 << context;

		let isListTerminated = atLeastOne ? false : this.#isListTerminator(context);
		const startPos = this.scanner.startPos;

		const elements: T[] = [];
		while (!isListTerminated) {
			if (this.#isListElement(context, false)) {
				const element = parseElement();
				elements.push(element);
				isListTerminated = this.#isListTerminator(context);
				continue;
			}
			if (this.#abortListParsing(context)) break;
		}
		this.currentContext = saveParsingContext;
		return this.#createNodeArray(elements, startPos);
	}

	#getContextParseError(context: ParsingContext) {
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
				return "Attribute marker expected."; // TODO: Was besseres finden
			case ParsingContext.None:
				return "Wat, no parsing context";
			case ParsingContext.Count:
				return "Wat, 'Count' parsing context";
			default:
				return assertNever(context);
		}
	}

	#isInSomeParsingContext(): boolean {
		for (let ctx = 0; ctx < ParsingContext.Count; ctx++) {
			if (this.currentContext & (1 << ctx)) {
				if (
					this.#isListElement(ctx, /*inErrorRecovery*/ true) ||
					this.#isListTerminator(ctx)
				) {
					return true;
				}
			}
		}

		return false;
	}

	#abortListParsing(context: ParsingContext) {
		this.#parseErrorAtCurrentToken(
			this.#getContextParseError(context),
			ParseError.FailedListParsing,
		);

		if (this.#isInSomeParsingContext()) {
			return true;
		}

		this.#nextToken();
		return false;
	}

	#isListElement(context: ParsingContext, _inErrorRecovery: boolean) {
		switch (context) {
			case ParsingContext.AssignmentList:
				return this.#isIdentifier();
			case ParsingContext.AttributeContainerList:
				return this.#token() === SyntaxKind.OpenBracketToken;
			case ParsingContext.EdgeRhsList:
				return (
					this.#token() === SyntaxKind.DirectedEdgeOp ||
					this.#token() === SyntaxKind.UndirectedEdgeOp
				);
			case ParsingContext.QuotedTextIdentifierConcatenation:
				// TODO: This may be wrong because the plus is only allowed to occur after a plusToken
				return (
					this.#token() === SyntaxKind.StringLiteral ||
					this.#token() === SyntaxKind.PlusToken
				);
			case ParsingContext.StatementList:
				return (
					this.#isIdentifier() ||
					this.#token() === SyntaxKind.SubgraphKeyword ||
					this.#token() === SyntaxKind.OpenBraceToken ||
					this.#token() === SyntaxKind.GraphKeyword ||
					this.#token() === SyntaxKind.EdgeKeyword ||
					this.#token() === SyntaxKind.NodeKeyword
				);
			default:
				throw "This should never happen";
		}
	}

	#isListTerminator(context: ParsingContext): boolean {
		const token = this.#token();

		// The we reached the end of the file, the list must be terminated
		if (token === SyntaxKind.EndOfFileToken) return true;

		switch (context) {
			case ParsingContext.StatementList:
				// Statement lists can only be closed by '}'
				return token === SyntaxKind.CloseBraceToken;
			case ParsingContext.AttributeContainerList:
				// The AttributeList is terminated by everything that is not a '['
				return token !== SyntaxKind.OpenBracketToken;
			case ParsingContext.AssignmentList:
				// Assignment lists can only be closed by ']'
				return token === SyntaxKind.CloseBracketToken;
			case ParsingContext.EdgeRhsList:
				// TODO: May adapt this to current flags
				// There can only be another EdgeRhs if there is an edgeOp
				return token !== SyntaxKind.DirectedEdgeOp && token !== SyntaxKind.UndirectedEdgeOp;
			case ParsingContext.QuotedTextIdentifierConcatenation:
				// Quoted strings are concatenated as long as there is a + following
				return token !== SyntaxKind.PlusToken;

			default:
				throw "Unsupported parsing context";
		}
	}

	#createEmptyArray<T extends SyntaxNode>(): SyntaxNodeArray<T> {
		const startPos = this.scanner.startPos;
		const elements: T[] = [];
		return this.#createNodeArray(elements, startPos);
	}

	#finishNode<T extends SyntaxNode>(node: T, end?: number): T {
		node.end = end === undefined ? this.scanner.startPos : end;

		/*
		if (contextFlags) {
			node.flags |= contextFlags;
		}
		*/

		// Keep track on the node if we encountered an error while parsing it.  If we did, then
		// we cannot reuse the node incrementally.  Once we've marked this node, clear out the
		// flag so that we don't mark any subsequent nodes.
		if (this.currentNodeHasError) {
			this.currentNodeHasError = false;
			node.flags |= SyntaxNodeFlags.ContainsErrors;
		}

		return node;
	}

	#createNode(kind: SyntaxKind, pos?: number): SyntaxNode {
		// TODO: Change to return a partial of the desired node
		this.nodeCount++;
		const p = pos !== undefined && pos >= 0 ? pos : this.scanner.startPos;
		if (isNodeKind(kind) || kind === SyntaxKind.Unknown) return newNode(kind, p, p);
		return isIdentifier(kind) ? newIdentifier(kind, p, p) : newToken(kind, p, p);
	}

	#createNodeArray<T extends SyntaxNode>(
		elements: T[],
		pos: number,
		end?: number,
	): SyntaxNodeArray<T> {
		// Since the element list of a node array is typically created by starting with an empty array and
		// repeatedly calling push(), the list may not have the optimal memory layout. We invoke slice() for
		// small arrays (1 to 4 elements) to give the VM a chance to allocate an optimal representation.
		const length = elements.length;
		const array = (
			(length >= 1 && length <= 4 ? elements.slice() : elements)
		) as MutableSyntaxNodeArray<T>;
		array.pos = pos;
		array.end = end === undefined ? this.scanner.startPos : end;
		return array;
	}

	#parseTokenNode<T extends SyntaxNode>(): T {
		const node = this.#createNode(this.#token()) as T;
		this.#nextToken();
		return this.#finishNode(node);
	}

	#getLastError(diagnostics: DiagnosticMessage[]) {
		return diagnostics && diagnostics.length > 0
			? diagnostics[diagnostics.length - 1]
			: undefined;
	}

	#parseErrorAtPosition(start: number, end: number, message: string, code: ErrorCode) {
		const ds = this.diagnostics;
		const lastError = this.#getLastError(ds);
		// Make sure we don't report an error on the same location twice

		if (!lastError || start !== lastError.start) {
			ds.push({
				category: DiagnosticCategory.Error,
				start,
				end,
				message,
				code,
			});
		}

		this.currentNodeHasError = true;
	}

	#parseErrorAtCurrentToken(message: string, sub: ParseError) {
		const error = {
			source: ErrorSource.Parse as ErrorSource.Parse,
			sub,
		};

		return this.#parseErrorAtPosition(this.scanner.tokenPos, this.scanner.pos, message, error);
	}

	#scanError(message: string, _category: DiagnosticCategory, sub: ScanError, length: number) {
		const errorPos = this.scanner.pos;
		const err = {
			source: ErrorSource.Scan as ErrorSource.Scan,
			sub,
		};

		this.#parseErrorAtPosition(errorPos, errorPos + length, message, err);
	}

	#reportExpectedError<T extends SyntaxKind>(expectedKinds: T[]) {
		const found = this.#isIdentifier()
			? "identifier"
			: this.#token() === SyntaxKind.EndOfFileToken
				? "end of file"
				: `"${getTokenAsText(this.#token())}"`;

		const expected = expectedKinds.map(k => {
			if (isIdentifier(k)) {
				return "identifier";
			}
			if (k === SyntaxKind.EndOfFileToken) {
				return "end of file";
			}
			return `"${getTokenAsText(k)}"`;
		});

		const lastExpected = expected.pop();
		const expectedJoined = expected.join(", ");

		const msg =
			expected.length > 0
				? `Expected ${expectedJoined} or ${lastExpected} but found ${found} instead.`
				: `Expected ${lastExpected} but found ${found} instead.`;

		// Report specific message if provided with one.  Otherwise, report generic fallback message.
		//if (diagnostic) {
		//	this.parseErrorAtCurrentToken(diagnostic);
		//}
		//else {
		this.#parseErrorAtCurrentToken(msg, ParseError.ExpectationFailed);
		//}
	}

	#parseExpectedOneOf<T extends SyntaxKind>(...kinds: T[]): boolean {
		if (kinds.length < 2) {
			console.assert(false);
			debugger;
		}
		for (const kind of kinds) {
			if (this.#token() === kind) {
				this.#nextToken();
				return true;
			}
		}

		this.#reportExpectedError(kinds);

		return false;
	}

	#parseExpectedTokenOneOf<T extends SyntaxKind>(fallback: T, kinds: T[]): Token<T> {
		if (kinds.length < 2) {
			console.assert(false);
			debugger;
		}

		for (const kind of kinds) {
			if (this.#token() === kind) {
				const node = this.#createNode(this.#token()) as Token<T>;
				this.#nextToken();
				return this.#finishNode(node);
			}
		}

		this.#reportExpectedError(kinds);

		// TODO: Fix this
		return this.#createMissingNode(fallback) as Token<T>;
	}

	#parseExpectedToken<T extends SyntaxKind>(kind: T /*, diagnostic?: Diagnostic */): Token<T> {
		const tokenNode = this.#parseOptionalToken(kind);
		if (tokenNode !== undefined) return tokenNode;

		this.#reportExpectedError([kind]);
		return this.#createMissingNode(kind) as Token<T>;
	}

	#parseExpected<T extends SyntaxKind>(kind: T /*, diagnostic?: Diagnostic */): boolean {
		const res = this.#parseOptional(kind);

		if (!res) this.#reportExpectedError([kind]);
		return res;
	}

	#parseOptionalToken<T extends SyntaxKind>(t: T): Token<T> | undefined {
		if (this.#token() === t) {
			return this.#parseTokenNode<Token<T>>();
		}
		return undefined;
	}

	#parseOptional<T extends SyntaxKind>(t: T): boolean {
		if (this.#token() === t) {
			this.#nextToken();
			return true;
		}
		return false;
	}

	#isEdgeOp(): boolean {
		switch (this.#token()) {
			case SyntaxKind.DirectedEdgeOp:
			case SyntaxKind.UndirectedEdgeOp:
				return true;
			default:
				return false;
		}
	}
	#isIdentifier(): boolean {
		switch (this.#token()) {
			case SyntaxKind.TextIdentifier:
			case SyntaxKind.NumericIdentifier:
			case SyntaxKind.StringLiteral:
			case SyntaxKind.HtmlIdentifier:
				return true;
			default:
				return false;
		}
	}
	#isCompassPortKind(kind: SyntaxKind): boolean {
		return kind >= SyntaxKind.CompassCenterToken && kind <= SyntaxKind.CompassEnd;
	}

	#speculationHelper(
		callback: () => SyntaxKind | boolean,
		isLookAhead: boolean,
	): SyntaxKind | boolean {
		// Keep track of the state we'll need to rollback to if lookahead fails (or if the
		// caller asked us to always reset our state).
		const saveToken = this.#token();
		const saveDiagnosticsLength = this.diagnostics.length;
		// TODO: const saveParseErrorBeforeNextFinishedNode = parseErrorBeforeNextFinishedNode;

		// If we're only looking ahead, then tell the scanner to only lookahead as well.
		// Otherwise, if we're actually speculatively parsing, then tell the scanner to do the
		// same.
		const result = isLookAhead
			? this.scanner.lookAhead(callback)
			: this.scanner.tryScan(callback);

		// If our callback returned something 'falsy' or we're just looking ahead,
		// then unconditionally restore us to where we were.
		if (!result || isLookAhead) {
			this.currentToken = saveToken;
			this.diagnostics.length = saveDiagnosticsLength;
			// TODO: parseErrorBeforeNextFinishedNode = saveParseErrorBeforeNextFinishedNode;
		}

		return result;
	}

	/** Invokes the provided callback then unconditionally restores the parser to the state it
	 * was in immediately prior to invoking the callback. The result of invoking the callback
	 * is returned from this function.
	 */
	#lookAhead(callback: () => SyntaxKind | boolean): SyntaxKind | boolean {
		return this.#speculationHelper(callback, /*isLookAhead*/ true);
	}

	/** Invokes the provided callback. If the callback returns something falsy, then it restores
	 * the parser to the state it was in immediately prior to invoking the callback. If the
	 * callback returns something truthy, then the parser state is not rolled back. The result
	 * of invoking the callback is returned from this function.
	 */
	#tryParse(callback: () => SyntaxKind | boolean): SyntaxKind | boolean {
		return this.#speculationHelper(callback, /*isLookAhead*/ false);
	}
}

function newNode(kind: SyntaxKind, pos: number, end: number): SyntaxNode {
	// this.id = 0;
	return {
		kind,
		flags: SyntaxNodeFlags.None,
		end,
		pos,
		parent: undefined,
	};
}
const newIdentifier = newNode;
const newToken = newNode;

function isNodeKind(kind: SyntaxKind) {
	return kind >= SyntaxKind.FirstNode;
}

export function isIdentifier(kind: SyntaxKind) {
	return (
		kind === SyntaxKind.HtmlIdentifier ||
		kind === SyntaxKind.NumericIdentifier ||
		kind === SyntaxKind.TextIdentifier ||
		kind === SyntaxKind.QuotedTextIdentifier
	);
	// || kind === SyntaxKind.StringLiteral // TODO: Is this needed?
}

export function isIdentifierNode(node: SyntaxNode): node is Identifier {
	return isIdentifier(node.kind);
}
