import { type DocumentSymbol, SymbolKind } from "vscode-languageserver-types";

import { getIdentifierText } from "../checker.ts";
import type { DocumentLike } from "../index.ts";
import {
	type EdgeSourceOrTarget,
	type Graph,
	type Identifier,
	type NodeId,
	type SourceFile,
	type Statement,
	type SubGraph,
	type SyntaxNode,
	type SyntaxNodeArray,
	syntaxKind,
} from "../types.ts";
import { syntaxNodeToRange } from "./util.ts";

export function getDocumentSymbols(doc: DocumentLike, sourceFile: SourceFile): DocumentSymbol[] {
	const g = sourceFile.graph;
	if (!g) return [];

	return [getGraphSymbol(doc, sourceFile, g)];
}

function getGraphSymbol(doc: DocumentLike, sf: SourceFile, g: Graph): DocumentSymbol {
	// The graph itself may be anonymous, but its keyword is always there to select
	const selection = g.id ?? g.keyword;

	return {
		name: g.id ? getIdentifierText(g.id) : keywordName(g),
		kind: SymbolKind.Class,
		range: syntaxNodeToRange(doc, sf, g),
		selectionRange: syntaxNodeToRange(doc, sf, selection),
		children: getStatementSymbols(doc, sf, g.statements),
	};
}

function keywordName(g: Graph): string {
	return g.kind === syntaxKind.DirectedGraph ? "digraph" : "graph";
}

function getSubGraphSymbol(doc: DocumentLike, sf: SourceFile, sg: SubGraph): DocumentSymbol {
	const range = syntaxNodeToRange(doc, sf, sg);

	return {
		name: sg.id ? getIdentifierText(sg.id) : "subgraph",
		kind: SymbolKind.Namespace,
		range,
		// Anonymous subgraphs have nothing narrower to select than the subgraph itself
		selectionRange: sg.id ? syntaxNodeToRange(doc, sf, sg.id) : range,
		children: getStatementSymbols(doc, sf, sg.statements),
	};
}

function getStatementSymbols(
	doc: DocumentLike,
	sf: SourceFile,
	statements: SyntaxNodeArray<Statement>,
): DocumentSymbol[] {
	const res: DocumentSymbol[] = [];
	// A node may be mentioned many times, but it is only declared once
	const seenNodeNames = new Set<string>();

	const addEndpoint = (endpoint: EdgeSourceOrTarget) => {
		if (endpoint.kind === syntaxKind.SubGraph) {
			res.push(getSubGraphSymbol(doc, sf, endpoint));
			return;
		}
		const symbol = getNodeSymbol(doc, sf, endpoint, seenNodeNames);
		if (symbol) res.push(symbol);
	};

	for (const statement of statements) {
		switch (statement.kind) {
			case syntaxKind.NodeStatement:
				addEndpoint(statement.id);
				break;
			case syntaxKind.EdgeStatement:
				addEndpoint(statement.source);
				for (const rhs of statement.rhs) addEndpoint(rhs.target);
				break;
			case syntaxKind.SubGraphStatement:
				res.push(getSubGraphSymbol(doc, sf, statement.subgraph));
				break;
			// Attribute defaults and graph properties are not symbols
			case syntaxKind.AttributeStatement:
			case syntaxKind.IdEqualsIdStatement:
				break;
		}
	}

	return res;
}

function getNodeSymbol(
	doc: DocumentLike,
	sf: SourceFile,
	nodeId: NodeId,
	seenNodeNames: Set<string>,
): DocumentSymbol | undefined {
	const name = getNodeName(nodeId.id);
	if (!name || seenNodeNames.has(name)) return undefined;
	seenNodeNames.add(name);

	return {
		name,
		kind: SymbolKind.Variable,
		range: syntaxNodeToRange(doc, sf, nodeId),
		selectionRange: syntaxNodeToRange(doc, sf, nodeId.id as SyntaxNode),
		children: [],
	};
}

function getNodeName(id: Identifier): string | undefined {
	const text = getIdentifierText(id);
	return text ? text : undefined;
}
