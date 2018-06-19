import * as lst from "vscode-languageserver-types";
import { SourceFile, SyntaxNodeFlags, SyntaxKind, Assignment, NodeId, EdgeStatement, SymbolTable } from "../types";
import { findNodeAtOffset, getIdentifierText, isEdgeStatement } from "../checker";
import { escapeIdentifierText } from "./util";
import { isIdentifierNode, DocumentLike } from "../";
import * as languageFacts from "./languageFacts";

// TODO: Rewrite pattern matching + completion
// Currently, we use this hack with "inclusiveEnd"
// TODO: May add "| undefined" to rettype
export function getCompletions(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.CompletionItem[] {
	const symbols = sourceFile.symbols;
	if (!symbols) throw "sourceFile is not bound";

	const g = sourceFile.graph;
	if (!g)
		return [];

	const offset = doc.offsetAt(position);

	const node = findNodeAtOffset(g, offset, true);
	if (!node)
		return [];
	const prevOffsetNode = findNodeAtOffset(g, offset - 1, true);

	const parent = node.parent;
	const prevOffsetNodeParent = prevOffsetNode ? prevOffsetNode.parent : undefined;

	if ((parent && parent.parent && isEdgeStatement(parent.parent)
			||
			(prevOffsetNodeParent && prevOffsetNodeParent.parent && isEdgeStatement(prevOffsetNodeParent.parent )))
	) {
		// const edgeStatement = parent.parent as EdgeStatement;
		return getNodeCompletions(symbols);
	}

	const prevNode = findNodeAtOffset(g, node.pos - 1, true);
	if (!prevNode)
		return [];

	if (isIdentifierNode(prevNode)) {
		const p = prevNode.parent;
		if (p) {
			switch (p.kind) {
				case SyntaxKind.NodeId: {
					return getNodeCompletions(symbols);
				}
				case SyntaxKind.Assignment: {
					return getAssignmentCompletion(p as Assignment);
				}
			}
		}
	}

	if ((node.flags & SyntaxNodeFlags.ContainsErrors) || node.end === node.pos) {
		const attribute = prevNode;
		if (!attribute)
			return [];

		if (!attribute.parent) throw "sourceFile is not bound";

		const parent = attribute.parent;
		if (parent.kind === SyntaxKind.Assignment) {
			return getAssignmentCompletion(parent as Assignment);
		}
	}

	return [];
}

function getAssignmentCompletion(assignment: Assignment): lst.CompletionItem[] {
	const property = getIdentifierText(assignment.leftId);
	if (!property)
		return [];

	switch (property.toLowerCase()) {
		case "shape": return getShapeCompletions();
		case "color": return getColorCompletions();
		default: return [];
	}
}

function getShapeCompletions(): lst.CompletionItem[] {
	const kind = lst.CompletionItemKind.EnumMember;
	return languageFacts.shapes.map(s => ({
		kind,
		label: escapeIdentifierText(s),
	}));
}

function getColorCompletions(): lst.CompletionItem[] {
	const kind = lst.CompletionItemKind.Color;
	const colors = languageFacts.colors;

	return Object.keys(colors)
		.map(label => ({
			kind,
			label,
			// If the completion kind is "color", the documentation can hold the color code
			// The color name is then displayed along with a preview of the color
			documentation: (colors as { [i: string]: string })[label],
		}));
}

function getNodeCompletions(symbols: SymbolTable): lst.CompletionItem[] {
	const res = new Array<lst.CompletionItem>();
	for (const [key, value] of symbols) {
		let kind: lst.CompletionItemKind = lst.CompletionItemKind.Variable;
		const a = value.firstMention.parent;
		if (a) {
			switch (a.kind) {
				case SyntaxKind.DirectedGraph:
				case SyntaxKind.UndirectedGraph:
					kind = lst.CompletionItemKind.Class;
					break;
			}
		}

		res.push({
			label: escapeIdentifierText(key),
			kind: kind as lst.CompletionItemKind,
		});
	}

	return res;
}

/*
function findPrevEquals(text: string, offset: number): number | undefined {
	for (let i = offset; i >= 0; --i) {
		const ch = text.charCodeAt(i);

		switch(ch) {
			case

		}

		if (ch === CharacterCodes.equals)
			return i;
	}
	return undefined;
}
*/
