import * as lst from "vscode-languageserver-types";
import { SyntaxKind, Graph, SubGraphStatement, SyntaxNode, Assignment, SourceFile, IdEqualsIdStatement, SubGraph } from "../types";
import { getIdentifierText, findNodeAtOffset } from "../checker";
import { DocumentLike } from "../";
import { isIdentifierNode } from "../parser";
import { getStart } from "./util";


export function hover(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.Hover | undefined {
	const offset = doc.offsetAt(position);

	const g = sourceFile.graph;
	if (!g)
		return undefined;

	const node = findNodeAtOffset(g, offset);
	if (node === undefined)
		return undefined;

	return getNodeHover(doc, sourceFile, node);
}

function getNodeHover(doc: DocumentLike, sf: SourceFile, n: SyntaxNode): lst.Hover | undefined {
	const contents = getHoverContents(n);

	if (contents) {
		const range = {
			start: doc.positionAt(getStart(sf, n)),
			end: doc.positionAt(n.end),
		};
		return {
			contents,
			range,
		};
	}
	return undefined;
}

// TODO: Maybe improve this to use something like
// type HoverHandler = (node: SyntaxNode, parent?: SyntaxNode) => undefined | string;
// TODO: Handle all leafs of the syntax tree
function getHoverContents(n: SyntaxNode): string | undefined {
	if (isIdentifierNode(n)) {
		const parent = n.parent;
		if (parent) {
			switch (parent.kind) {
				case SyntaxKind.NodeId:
					return `(node) ${getIdentifierText(n)}`;
				case SyntaxKind.Assignment: {
					const assignment = parent as Assignment;
					const left = getIdentifierText(assignment.leftId);
					const right = getIdentifierText(assignment.rightId);
					return `(assignment) \`${left}\` = \`${right}\``;
				}
				case SyntaxKind.DirectedGraph:
					return getGraphHover(parent as Graph);
				case SyntaxKind.UndirectedGraph:
					return getGraphHover(parent as Graph);
				case SyntaxKind.SubGraphStatement: {
					const sgs = (parent as SubGraphStatement);
					const sg = sgs.subgraph;
					return !!sg.id
						? `(sub graph) ${getIdentifierText(sg.id)}`
						: `(sub graph)`;
				}
				case SyntaxKind.SubGraph: {
					const sg = (parent as SubGraph);
					return !!sg.id
						? `(sub graph) ${getIdentifierText(sg.id)}`
						: `(sub graph)`;
				}
				case SyntaxKind.IdEqualsIdStatement: {
					const idEqId = parent as IdEqualsIdStatement;
					const left = getIdentifierText(idEqId.leftId);
					const right = getIdentifierText(idEqId.rightId);
					return `(graph property) \`${left}\` = \`${right}\``;
				}
			}
			return SyntaxKind[parent.kind];
		}

		const fallback = SyntaxKind[n.kind];
		return fallback
			? "(" + fallback.toLowerCase() + ")"
			: undefined;
	}

	switch (n.kind) {
		case SyntaxKind.GraphKeyword:
		case SyntaxKind.DigraphKeyword:
		case SyntaxKind.StrictKeyword:
			return getGraphHover(n.parent as Graph);

		// TODO: Why does findNodeAtOffset() return a non-leaf node
		// Did not expect to need to have this here.
		case SyntaxKind.DirectedGraph:
		case SyntaxKind.UndirectedGraph:
			return getGraphHover(n as Graph);

		default:
			return undefined;
	}
}

function getGraphHover(g: Graph): string {
	const direction = g.kind === SyntaxKind.DirectedGraph ? "directed" : "undirected";
	const graphId = g.id;
	const strict = g.strict ? "strict " : "";
	return !!graphId
		? `(${strict}${direction} graph) ${(getIdentifierText(graphId))}`
		: `(${strict}${direction} graph)`;
}
