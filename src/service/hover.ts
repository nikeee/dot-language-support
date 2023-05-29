import type * as lst from "vscode-languageserver-types";
import { SyntaxKind, Graph, SubGraphStatement, SyntaxNode, Assignment, SourceFile, IdEqualsIdStatement, SubGraph, EdgeRhs, EdgeStatement, EdgeSourceOrTarget } from "../types.js";
import { getIdentifierText, findNodeAtOffset } from "../checker.js";
import { DocumentLike, NodeStatement } from "../index.js";
import { isIdentifierNode } from "../parser.js";
import { syntaxNodeToRange } from "./util.js";
import { getEdgeStr } from "./command/common.js";


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
		return {
			contents,
			range: syntaxNodeToRange(doc, sf, n),
		};
	}
	return undefined;
}

function getAssignedLabel(statement: NodeStatement) {
	const assignments = statement.attributes.flatMap(a => a.assignments);
	const assignedLabel = assignments?.find(a => getIdentifierText(a.leftId) === "label");
	return assignedLabel?.rightId ? getIdentifierText(assignedLabel.rightId) : undefined;
}

// TODO: Maybe improve this to use something like
// type HoverHandler = (node: SyntaxNode, parent?: SyntaxNode) => undefined | string;
// TODO: Handle all leafs of the syntax tree
function getHoverContents(n: SyntaxNode): string | undefined {
	if (isIdentifierNode(n)) {
		const parent = n.parent;
		if (parent) {
			switch (parent.kind) {
				case SyntaxKind.NodeId: {

					// See https://github.com/nikeee/dot-language-support/issues/83
					if (n.symbol?.references) {
						const nodeIdentifierRefs = n.symbol?.references;
						const labelMentions = nodeIdentifierRefs.map(e => e.symbol?.members?.get("label")?.firstMention.parent as IdEqualsIdStatement | null | undefined);
						for (let i = labelMentions.length; i > 0; i--) {
							const s = labelMentions[i];
							if (s?.rightId) {
								return `(node) ${getIdentifierText(n)}: ${getIdentifierText(s.rightId)}`;
							}
						}
					} else if (parent.parent?.kind === SyntaxKind.NodeStatement) {
						const label = getAssignedLabel(parent.parent as NodeStatement);
						if (label) {
							return `(node) ${getIdentifierText(n)}: ${label}`;
						}
					}
					return `(node) ${getIdentifierText(n)}`;
				}
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
				case SyntaxKind.EdgeRhs:
					return getEdgeHover(parent as EdgeRhs);
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

		case SyntaxKind.DirectedEdgeOp:
		case SyntaxKind.UndirectedEdgeOp:
			return getEdgeHover(n.parent as EdgeRhs);

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

function getEdgeHover(n: EdgeRhs) {
	const p = n.parent as EdgeStatement;
	if (!p || p.rhs.length === 0)
		return undefined;

	let source: EdgeSourceOrTarget | undefined = undefined;
	for (const curr of p.rhs) {
		if (curr === n)
			break;
		source = curr.target;
	}

	if (source === undefined)
		source = p.source;

	const edgeOpStr = getEdgeStr(n.operation.kind);

	return source === undefined
		? undefined
		: `(edge) ${getEdgeSourceOrTargetText(source)} ${edgeOpStr} ${getEdgeSourceOrTargetText(n.target)}`;
}

function getEdgeSourceOrTargetText(n: EdgeSourceOrTarget): string {
	return n.kind === SyntaxKind.NodeId
		? getIdentifierText(n.id)
		: n.id !== undefined
			? `${getIdentifierText(n.id)}`
			: "sub graph";
}
