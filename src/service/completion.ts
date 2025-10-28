import * as lst from "vscode-languageserver-types";
import { findNodeAtOffset, getIdentifierText, isEdgeStatement } from "../checker.js";
import { type DocumentLike, isIdentifierNode } from "../index.js";
import {
	type Assignment,
	type AttributeContainer,
	type SourceFile,
	type SymbolTable,
	syntaxKind,
	syntaxNodeFlags,
} from "../types.js";
import * as languageFacts from "./languageFacts.js";
import { escapeIdentifierText } from "./util.js";

// TODO: Rewrite pattern matching + completion
// Currently, we use this hack with "inclusiveEnd"
// TODO: May add "| undefined" to rettype
export function getCompletions(
	doc: DocumentLike,
	sourceFile: SourceFile,
	position: lst.Position,
): lst.CompletionItem[] {
	const symbols = sourceFile.symbols;
	if (!symbols) throw "sourceFile is not bound";

	const g = sourceFile.graph;
	if (!g) return [];

	const offset = doc.offsetAt(position);

	const node = findNodeAtOffset(g, offset, true);
	if (!node) return [];
	const prevOffsetNode = findNodeAtOffset(g, offset - 1, true);

	const parent = node.parent;
	const prevOffsetNodeParent = prevOffsetNode?.parent;

	if (
		(parent?.parent && isEdgeStatement(parent.parent)) ||
		(prevOffsetNodeParent?.parent && isEdgeStatement(prevOffsetNodeParent.parent))
	) {
		// const edgeStatement = parent.parent as EdgeStatement;
		return getNodeCompletions(symbols);
	}

	// Hack to fix GitHub issue #17
	// We have problems handling whitespace when finding a node at a specific offset
	// So we check if the current cursor is in an AttributeContainer ("   [   ]") and if the cursor is before the end
	if (node.kind === syntaxKind.AttributeContainer) {
		const openingBracket = (node as AttributeContainer).openBracket;
		if (openingBracket.end - 1 > offset - 1) {
			// - 1 for semantic clarity

			const exclusions =
				prevOffsetNode?.kind === syntaxKind.TextIdentifier && prevOffsetNode.symbol
					? [prevOffsetNode.symbol.name]
					: undefined;
			return getNodeCompletions(symbols, exclusions);
		}
	}

	if (node.kind === syntaxKind.TextIdentifier && parent?.kind === syntaxKind.NodeId) {
		const exclusions = node.symbol ? [node.symbol.name] : undefined;
		return getNodeCompletions(symbols, exclusions);
	}

	if (
		node.kind === syntaxKind.AttributeContainer ||
		(node.kind === syntaxKind.CommaToken && parent?.kind === syntaxKind.Assignment)
	) {
		return getAttributeCompletions(position);
	}

	const prevNode = findNodeAtOffset(g, node.pos - 1, true);
	if (!prevNode) return [];

	if (isIdentifierNode(prevNode)) {
		const p = prevNode.parent;
		if (p) {
			switch (p.kind) {
				case syntaxKind.NodeId:
					return getNodeCompletions(symbols);
				case syntaxKind.Assignment:
					return getAssignmentCompletion(p as Assignment);
			}
		}
	}

	if (node.flags & syntaxNodeFlags.ContainsErrors || node.end === node.pos) {
		const attribute = prevNode;
		if (!attribute) return [];

		if (!attribute.parent) throw "sourceFile is not bound";

		const parent = attribute.parent;
		if (parent.kind === syntaxKind.Assignment) {
			return getAssignmentCompletion(parent as Assignment);
		}
	}

	return [];
}

function getAssignmentCompletion(assignment: Assignment): lst.CompletionItem[] {
	const property = getIdentifierText(assignment.leftId);
	if (!property) return [];

	switch (property.toLowerCase()) {
		case "shape":
			return getShapeCompletions();
		case "color":
			return getColorCompletions();
		default:
			return [];
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

	return Object.keys(colors).map(label => ({
		kind,
		label,
		// If the completion kind is "color", the documentation can hold the color code
		// The color name is then displayed along with a preview of the color
		documentation: (colors as { [i: string]: string })[label],
	}));
}

function getAttributeCompletions(posistion: lst.Position): lst.CompletionItem[] {
	const kind = lst.CompletionItemKind.Property;
	const range = {
		start: posistion,
		end: posistion,
	};

	return languageFacts.attributes.map(label => ({
		kind,
		label,
		textEdit: {
			range,
			newText: `${escapeIdentifierText(label)}=`,
		},
	}));
}

function getNodeCompletions(
	symbols: SymbolTable,
	exlucdedSymbols?: string[],
): lst.CompletionItem[] {
	const res: lst.CompletionItem[] = [];
	for (const [key, value] of symbols) {
		if (exlucdedSymbols?.includes(key)) continue;

		let kind: lst.CompletionItemKind = lst.CompletionItemKind.Variable;
		const a = value.firstMention.parent;
		if (a) {
			switch (a.kind) {
				case syntaxKind.DirectedGraph:
				case syntaxKind.UndirectedGraph:
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
