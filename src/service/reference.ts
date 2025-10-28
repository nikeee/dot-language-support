import type { Location, Position, ReferenceContext } from "vscode-languageserver-types";

import { findNodeAtOffset } from "../checker.ts";
import { type DocumentLike, isIdentifierNode } from "../index.ts";
import type { SourceFile, SyntaxNode } from "../types.ts";
import { syntaxNodesToRanges, syntaxNodeToRange } from "./util.ts";

export function findReferences(
	doc: DocumentLike,
	sourceFile: SourceFile,
	position: Position,
	context: ReferenceContext,
): Location[] {
	if (!sourceFile.symbols) throw "sourceFile is not bound";

	const g = sourceFile.graph;
	if (!g) return [];

	const offset = doc.offsetAt(position);

	const node = findNodeAtOffset(g, offset);
	if (!node) return [];

	if (isIdentifierNode(node)) {
		const nodeSymbol = node.symbol;
		if (!nodeSymbol) throw "node.symbol is not bound";

		const refs = nodeSymbol.references || [];
		let symbolRefs: SyntaxNode[];

		// Depending on what should be included, create relevant references
		if (context.includeDeclaration) {
			symbolRefs = [nodeSymbol.firstMention, ...refs];
		} else {
			if (nodeSymbol.firstMention === node) {
				symbolRefs = refs;
			} else {
				symbolRefs = [nodeSymbol.firstMention, ...refs.filter(r => r !== node)];
			}
		}

		// make range values from SyntaxNodes
		const ranges = syntaxNodesToRanges(doc, sourceFile, symbolRefs);

		const uri = doc.uri;
		// add the URI parameter
		return ranges.map(range => {
			return { uri, range };
		});
	}

	debugger;
	return [];
}

export function findDefinition(
	doc: DocumentLike,
	sourceFile: SourceFile,
	position: Position,
): Location | undefined {
	if (!sourceFile.symbols) throw "sourceFile is not bound";

	// TODO: If it is not a node identifier, there is no "definition", since it must be an assignment

	const g = sourceFile.graph;
	if (!g) return undefined;

	const offset = doc.offsetAt(position);
	const node = findNodeAtOffset(g, offset);
	if (!node) return undefined;

	if (isIdentifierNode(node)) {
		const nodeSymbol = node.symbol;
		if (!nodeSymbol) throw "node.symbol is not bound";

		// TODO: These are unused?
		// const refs = nodeSymbol.references || [];
		// let symbolRefs: SyntaxNode[];

		const firstMention = nodeSymbol.firstMention;
		if (!firstMention) return undefined;

		// make range values from SyntaxNodes
		const range = syntaxNodeToRange(doc, sourceFile, firstMention);

		// add the URI parameter
		return { uri: doc.uri, range };
	}

	debugger;
	return undefined;
}
