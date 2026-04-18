import type { Position, SelectionRange } from "vscode-languageserver-types";

import { findNodeAtOffset } from "../checker.ts";
import type { DocumentLike } from "../index.ts";
import type { SourceFile } from "../types.ts";
import { syntaxNodeToRange } from "./util.ts";

export function getSelectionRanges(
	doc: DocumentLike,
	sourceFile: SourceFile,
	positions: Position[],
): SelectionRange[] {
	return positions.map(p => buildSelectionRange(doc, sourceFile, p));
}

function buildSelectionRange(
	doc: DocumentLike,
	sourceFile: SourceFile,
	position: Position,
): SelectionRange {
	const empty = { range: { start: position, end: position } };

	const g = sourceFile.graph;
	if (!g) {
		return empty;
	}

	const offset = doc.offsetAt(position);
	const leaf = findNodeAtOffset(g, offset, true);

	const chain = [];
	let curr = leaf;
	while (curr) {
		chain.push(curr);
		curr = curr.parent;
	}

	if (chain.length === 0) {
		return empty;
	}

	let result: SelectionRange | undefined;
	let lastKey: string | undefined;
	for (let i = chain.length - 1; i >= 0; i--) {
		const range = syntaxNodeToRange(doc, sourceFile, chain[i]);
		const key = `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`;
		if (key === lastKey) {
			continue;
		}

		lastKey = key;
		result = { range, parent: result };
	}

	return result ?? empty;
}
