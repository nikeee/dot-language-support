import { type Position, TextEdit, type WorkspaceEdit } from "vscode-languageserver-types";

import { findNodeAtOffset } from "../checker.ts";
import { type DocumentLike, isIdentifierNode } from "../index.ts";
import { type SourceFile, type SyntaxNode, syntaxKind } from "../types.ts";
import { syntaxNodesToRanges } from "./util.ts";

export function renameSymbol(
	doc: DocumentLike,
	sourceFile: SourceFile,
	position: Position,
	newName: string,
): WorkspaceEdit | undefined {
	if (!sourceFile.symbols) throw "sourceFile is not bound";

	if (!newName) return undefined;

	const g = sourceFile.graph;
	if (!g) return undefined;

	const offset = doc.offsetAt(position);

	const node = findNodeAtOffset(g, offset);
	if (!node) return undefined;

	const parent = node.parent;
	if (
		isIdentifierNode(node) &&
		isRenamableIdentifier(node) &&
		!!parent &&
		isRenameableNode(parent)
	) {
		const nodeSymbol = node.symbol;
		if (!nodeSymbol) throw "node.symbol is not bound";

		const r = nodeSymbol.references;
		const refs = r ? [nodeSymbol.firstMention, ...r] : [nodeSymbol.firstMention];

		const ranges = syntaxNodesToRanges(doc, sourceFile, refs);

		const uri = doc.uri;

		const res = {
			changes: {
				[uri]: ranges.map(r => TextEdit.replace(r, newName)),
			},
		};
		return res;
	}

	debugger;
	return undefined;
}

function isRenameableNode(node: SyntaxNode): boolean {
	return (
		node.kind === syntaxKind.NodeId ||
		node.kind === syntaxKind.DirectedGraph ||
		node.kind === syntaxKind.UndirectedGraph
	);
}

function isRenamableIdentifier(node: SyntaxNode): boolean {
	return node.kind !== syntaxKind.QuotedTextIdentifier;
}
