import * as lst from "vscode-languageserver-types";
import { SyntaxKind, Graph, SubGraphStatement, SyntaxNode, Assignment, SourceFile, IdEqualsIdStatement, SubGraph } from "../types";
import { getIdentifierText, findNodeAtOffset } from "../checker";
import { isIdentifierNode, Parser, DocumentLike } from "../";
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

	if(contents) {
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
				case SyntaxKind.DirectedGraph: {
					const graphId = (parent as Graph).id;
					if (graphId)
						return `(directed graph) ${graphId}`;
					return `(directed graph)`;
				}
				case SyntaxKind.UndirectedGraph: {
					const graphId = (parent as Graph).id;
					if (graphId)
						return `(undirected graph) ${graphId}`;
					return `(undirected graph)`;
				}
				case SyntaxKind.SubGraphStatement: {
					const sgs = (parent as SubGraphStatement);
					const sg = sgs.subgraph;
					if (sg.id)
						return `(sub graph) ${getIdentifierText(sg.id)}`;
					return `(sub graph)`;
				}
				case SyntaxKind.SubGraph: {
					const sg = (parent as SubGraph);
					if (sg.id)
						return `(sub graph) ${getIdentifierText(sg.id)}`;
					return `(sub graph)`;
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
		return SyntaxKind[n.kind];
	}
	return undefined;
}
