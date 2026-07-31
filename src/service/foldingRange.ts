import type { FoldingRange } from "vscode-languageserver-types";

import type { DocumentLike } from "../index.ts";
import { type SourceFile, type SyntaxNode, syntaxKind } from "../types.ts";
import { forEachChild } from "../visitor.ts";
import { getStart } from "./util.ts";

/**
 * Everything that is delimited by a pair of braces or brackets can be folded.
 */
function isFoldable(node: SyntaxNode): boolean {
	switch (node.kind) {
		case syntaxKind.DirectedGraph:
		case syntaxKind.UndirectedGraph:
		case syntaxKind.SubGraph:
		case syntaxKind.AttributeContainer:
			return true;
		default:
			return false;
	}
}

export function getFoldingRanges(doc: DocumentLike, sourceFile: SourceFile): FoldingRange[] {
	const g = sourceFile.graph;
	if (!g) return [];

	const res: FoldingRange[] = [];
	collectFoldingRanges(doc, sourceFile, g, res);
	return res;
}

function collectFoldingRanges(
	doc: DocumentLike,
	sourceFile: SourceFile,
	node: SyntaxNode,
	res: FoldingRange[],
): void {
	if (isFoldable(node)) {
		const range = toFoldingRange(doc, sourceFile, node);
		if (range) res.push(range);
	}

	forEachChild(node, child => {
		collectFoldingRanges(doc, sourceFile, child, res);
		return undefined;
	});
}

function toFoldingRange(
	doc: DocumentLike,
	sourceFile: SourceFile,
	node: SyntaxNode,
): FoldingRange | undefined {
	const startLine = doc.positionAt(getStart(sourceFile, node)).line;
	// node.end points behind the closing brace/bracket, so this is the line it sits on.
	// Folding up to the line before it keeps the closing token visible, like other language services do.
	const endLine = doc.positionAt(node.end).line - 1;

	return endLine > startLine ? { startLine, endLine } : undefined;
}
