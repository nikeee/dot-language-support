import { type Position, TextEdit, type WorkspaceEdit } from "vscode-languageserver-types";
import { findNodeAtOffset } from "../checker.js";
import { type DocumentLike, isIdentifierNode } from "../index.js";
import { type SourceFile, SyntaxKind, type SyntaxNode } from "../types.js";
import { syntaxNodesToRanges } from "./util.js";

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
		node.kind === SyntaxKind.NodeId ||
		node.kind === SyntaxKind.DirectedGraph ||
		node.kind === SyntaxKind.UndirectedGraph
	);
}

function isRenamableIdentifier(node: SyntaxNode): boolean {
	return node.kind !== SyntaxKind.QuotedTextIdentifier;
}
