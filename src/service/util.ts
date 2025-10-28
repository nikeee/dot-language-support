import type { Range } from "vscode-languageserver-types";
import type { DocumentLike } from "../index.js";
import { isIdentifierStart, skipTrivia } from "../scanner.js";
import { type SourceFile, syntaxKind, type SyntaxNode } from "../types.js";

export function getStart(sourceFile: SourceFile, node: SyntaxNode) {
	return getTokenPosOfNode(sourceFile, node);
}

function getTokenPosOfNode(sourceFile: SourceFile, node: SyntaxNode): number {
	// Missing nodes have the same start pos as end pos.
	// Skipping trivia would lead us to the next token.
	if (nodeIsMissing(node)) return node.pos;

	return skipTrivia(sourceFile.content, node.pos);
}
function nodeIsMissing(node: SyntaxNode) {
	return node === undefined
		? true
		: node.pos === node.end && node.pos >= 0 && node.kind !== syntaxKind.EndOfFileToken;
}

export function syntaxNodesToRanges(
	doc: DocumentLike,
	sourceFile: SourceFile,
	nodes: SyntaxNode[],
): Range[] {
	return nodes.map(node => syntaxNodeToRange(doc, sourceFile, node));
}

export function syntaxNodeToRange(doc: DocumentLike, sourceFile: SourceFile, node: SyntaxNode) {
	const start = getStart(sourceFile, node);
	return {
		start: doc.positionAt(start),
		end: doc.positionAt(node.end),
	};
}

export function escapeIdentifierText(text: string): string {
	if (text === "") return quote("");
	if (text.includes('"') || text.includes("\n")) {
		const esc = text.replace(/"/, '\\"').replace(/\n/, "\\\n");
		return quote(esc);
	}

	const ch = text.charCodeAt(0);
	if (!isIdentifierStart(ch) || text.includes(" ")) return quote(text);
	return text;
}

const quote = (s: string) => `"${s}"`;

export function assertNever(v: never): never {
	throw new Error(`Should not have reached this. Value: ${v ?? ""}`);
}
