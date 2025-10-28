import { getIdentifierText, nodeContainsErrors } from "./checker.ts";
import { isIdentifierNode } from "./parser.ts";
import {
	type Assignment,
	type AttributeContainer,
	type AttributeStatement,
	type ColorInfo,
	type ColorTable,
	type CompassPortDeclaration,
	type EdgeRhs,
	type EdgeStatement,
	type Graph,
	type GraphContext,
	graphContext,
	type IdEqualsIdStatement,
	type Identifier,
	type NodeId,
	type NodeStatement,
	type NormalPortDeclaration,
	type QuotedTextIdentifier,
	type SourceFile,
	type Statement,
	type SubGraph,
	type SubGraphStatement,
	type SymbolTable,
	type SyntaxNode,
	type SyntaxNodeArray,
	syntaxKind,
	type TypeSymbol,
} from "./types.ts";

interface Binder {
	bind(file: SourceFile): void;
}

const binder = createBinder();

export function bindSourceFile(file: SourceFile) {
	binder.bind(file);
}

function createBinder(): Binder {
	let parent: SyntaxNode | undefined;
	let symbolTable: SymbolTable | undefined;
	let colorTable: ColorTable | undefined;
	let gc: GraphContext = graphContext.None;

	function bind(node: SyntaxNode): void {
		if (!node) return;

		const saveParent = parent;
		const saveContext = gc;

		node.parent = saveParent;
		node.graphContext = saveContext;

		parent = node;

		innerBind(node);

		parent = saveParent;
		gc = saveContext;
	}

	function innerBind(node: SyntaxNode): void {
		switch (node.kind) {
			case syntaxKind.DirectedGraph:
			case syntaxKind.UndirectedGraph:
				return bindGraph(node as Graph);
			case syntaxKind.AttributeStatement:
				return bindAttributeStatement(node as AttributeStatement);
			case syntaxKind.EdgeStatement:
				return bindEdgeStatement(node as EdgeStatement);
			case syntaxKind.NodeStatement:
				return bindNodeStatement(node as NodeStatement);
			case syntaxKind.SubGraph:
				return bindSubGraph(node as SubGraph);
			case syntaxKind.SubGraphStatement:
				return bindSubGraphStatement(node as SubGraphStatement);
			case syntaxKind.IdEqualsIdStatement:
				return bindIdEqualsIdStatement(node as IdEqualsIdStatement);
			case syntaxKind.QuotedTextIdentifier:
				return bindQuotedTextIdentifier(node as QuotedTextIdentifier);
			case syntaxKind.EdgeRhs:
				return bindEdgeRhs(node as EdgeRhs);
			case syntaxKind.AttributeContainer:
				return bindAttributeContainer(node as AttributeContainer);
			case syntaxKind.Assignment:
				return bindAssignment(node as Assignment);
			case syntaxKind.NormalPortDeclaration:
				return bindNormalPortDeclaration(node as NormalPortDeclaration);
			case syntaxKind.CompassPortDeclaration:
				return bindCompassPortDeclaration(node as CompassPortDeclaration);
			case syntaxKind.NodeId:
				return bindNodeId(node as NodeId);
			default:
				if (node.kind >= syntaxKind.FirstNode) throw "TODO";
		}
	}

	function bindGraph(node: Graph) {
		if (node.strict) {
			gc |= graphContext.Strict;
		}
		switch (node.kind) {
			case syntaxKind.DirectedGraph:
				gc |= graphContext.Directed;
				break;
			case syntaxKind.UndirectedGraph:
				gc |= graphContext.Undirected;
				break;
		}

		if (node.id) {
			ensureGlobalSymbol(node.id);
			bind(node.id);
		}
		if (node.strict) bind(node.strict);
		bindChildren(node.statements);
	}

	function bindAttributeStatement(node: AttributeStatement) {
		// ensureGlobalSymbol(node.subject); // TODO: this treats "node", "edge", "graph" as symbols. is this correct?
		bind(node.subject);
		bindChildren(node.attributes);
		if (node.terminator) bind(node.terminator);
	}

	function bindEdgeStatement(node: EdgeStatement) {
		bindChildren(node.attributes);
		bindChildren(node.rhs);
		bind(node.source);
		if (node.terminator) bind(node.terminator);
	}

	function bindNodeStatement(node: NodeStatement) {
		// not calling "ensureSymbol(node.id)" because "node.id" is a NodeId which has the ID property
		bind(node.id);

		bindChildren(node.attributes);
		if (node.terminator) bind(node.terminator);
	}

	function bindSubGraph(node: SubGraph) {
		if (node.id) {
			/* ensureSymbol(node.id); */ bind(node.id);
		}
		bindChildren(node.statements);
	}

	function bindSubGraphStatement(node: SubGraphStatement) {
		bind(node.subgraph);
		if (node.terminator) bind(node.terminator);
	}

	function bindIdEqualsIdStatement(node: IdEqualsIdStatement) {
		bind(node.leftId);

		bind(node.rightId); // TODO: What to do with rightId? Also add it to the symbol table? Or create a value table?

		if (node.rightId && !nodeContainsErrors(node.rightId)) {
			// if right-id is all-okay, we can look if it provides something for our tables

			// if the leftId is "color", rightId provides a color
			if (isAttributeName("color", node.leftId)) {
				ensureGlobalColor(node.rightId);
			} else if (isAttributeName("fillcolor", node.leftId)) {
				ensureGlobalColor(node.rightId);
			} else if (isAttributeName("bgcolor", node.leftId)) {
				ensureGlobalColor(node.rightId);
			} else if (isAttributeName("fontcolor", node.leftId)) {
				ensureGlobalColor(node.rightId);
			}
		}

		if (node.terminator) bind(node.terminator);
	}

	function bindQuotedTextIdentifier(node: QuotedTextIdentifier) {
		bindChildren(node.values);
		node.concatenation = node.values.map(v => v.text).join("");
	}

	function bindEdgeRhs(node: EdgeRhs) {
		bind(node.operation);
		bind(node.target);
	}

	function bindAttributeContainer(node: AttributeContainer) {
		bind(node.openBracket);
		bindChildren(node.assignments);
		bind(node.closeBracket);
	}

	function bindAssignment(node: Assignment) {
		const attrContainer = node.parent as AttributeContainer;
		console.assert(!!attrContainer);
		const superParentStatement = attrContainer.parent as Statement;
		console.assert(!!superParentStatement);

		bind(node.leftId);

		// TODO: This is crap, fix it

		let carrierIdentifier: Identifier | undefined;
		switch (superParentStatement.kind) {
			case syntaxKind.NodeStatement:
				carrierIdentifier = superParentStatement.id.id;
				break;
			case syntaxKind.EdgeStatement:
				// carrierIdentifier = superParentStatement.source.id;
				break;
			case syntaxKind.SubGraphStatement:
				// carrierIdentifier = superParentStatement.id;
				break;
			case syntaxKind.AttributeStatement:
				// carrierIdentifier = superParentStatement.subject;
				break;
		}

		if (carrierIdentifier) ensureMemberSymbol(node.leftId, carrierIdentifier);

		bind(node.rightId); // TODO: What to do with rightId? Also add it to the symbol table? Or create a value table?

		if (node.rightId && !nodeContainsErrors(node.rightId)) {
			// TODO: Look out for other assignments that can assign colors

			// if right-id is all-okay, we can look if it provides something for our tables

			// if the leftId is "color", rightId provides a color
			if (isAttributeName("color", node.leftId)) {
				ensureGlobalColor(node.rightId);
			}
		}

		if (node.terminator) bind(node.terminator);
	}

	function bindNormalPortDeclaration(node: NormalPortDeclaration) {
		bind(node.colon);
		ensureGlobalSymbol(node.id);
		bind(node.id);
		if (node.compassPt) bind(node.compassPt);
	}

	function bindCompassPortDeclaration(node: CompassPortDeclaration) {
		bind(node.colon);
		if (node.compassPt) bind(node.compassPt);
	}

	function bindNodeId(node: NodeId) {
		ensureGlobalSymbol(node.id);
		bind(node.id);
		if (node.port) bind(node.port);
	}

	function bindChildren(nodes: SyntaxNodeArray<SyntaxNode>): void {
		for (const n of nodes) bind(n);
	}

	function createSymbolTable(): SymbolTable {
		return new Map<string, TypeSymbol>();
	}
	function createColorTable(): ColorTable {
		return new Map<string, ColorInfo>();
	}

	function ensureMemberSymbol(node: SyntaxNode, carrier: Identifier) {
		if (node && carrier && isIdentifierNode(node)) {
			const name = getIdentifierText(node);
			if (name === undefined) return;

			const carrierSymbol = carrier.symbol;
			if (carrierSymbol === undefined) throw "carrierSymbol is undefined";

			let symbols = carrierSymbol.members;
			if (symbols === undefined) carrierSymbol.members = symbols = createSymbolTable();

			ensureSymbolOnTable(name, node, symbols);
			return;
		}
		console.warn("ensureSymbol called on non-identifier node");
		debugger;
	}

	function ensureGlobalSymbol(node: SyntaxNode) {
		if (node && isIdentifierNode(node)) {
			const symbols = symbolTable;
			const name = getIdentifierText(node);

			if (name === undefined) return;
			if (symbols === undefined) throw "symbolTable is undefined";

			ensureSymbolOnTable(name, node, symbols);
			return;
		}
		console.warn("ensureSymbol called on non-identifier node");
		debugger;
	}

	function ensureSymbolOnTable(name: string, node: SyntaxNode, symbols: SymbolTable) {
		if (!name) return;
		let sym = symbols.get(name);
		if (sym === undefined) {
			sym = createSymbol(name, node);
			symbols.set(name, sym);
		} else {
			if (!sym.references) sym.references = [node];
			else sym.references.push(node);
		}
		node.symbol = sym;
	}

	function ensureGlobalColor(node: Identifier) {
		if (node && isIdentifierNode(node)) {
			const colors = colorTable;
			const name = getIdentifierText(node);

			if (name === undefined) return;
			if (colors === undefined) throw "symbolTable is undefined";

			const color = createColor(node);
			colors.set(name, color);

			return;
		}
		console.warn("ensureSymbol called on non-identifier node");
		debugger;
	}

	function createSymbol(name: string, node: SyntaxNode): TypeSymbol {
		if (!name) throw "name is falsy";
		if (!node) throw "node is undefined or null";
		return {
			name,
			firstMention: node,
			references: undefined,
		};
	}

	function createColor(node: Identifier): ColorInfo {
		return {
			node,
		};
	}

	/**
	 * @param name Pass lower cased
	 */
	function isAttributeName(name: string, id?: Identifier): boolean {
		return id ? getIdentifierText(id).trim().toLowerCase() === name : false;
	}

	return {
		bind: file => {
			symbolTable = createSymbolTable();
			colorTable = createColorTable();
			const { graph } = file;
			if (graph) bind(graph);
			file.symbols = symbolTable;
			file.colors = colorTable;
		},
	};
}
