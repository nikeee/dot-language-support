import type * as lst from "vscode-languageserver-types";
import { findNodeAtOffset, getIdentifierText } from "../checker.js";
import type { DocumentLike, NodeStatement } from "../index.js";
import { isIdentifierNode } from "../parser.js";
import {
	type Assignment,
	type EdgeRhs,
	type EdgeSourceOrTarget,
	type EdgeStatement,
	type Graph,
	type IdEqualsIdStatement,
	type SourceFile,
	type SubGraph,
	type SubGraphStatement,
	type SyntaxNode,
	syntaxKind,
	syntaxKindNames,
} from "../types.js";
import { getEdgeStr } from "./command/common.js";
import { syntaxNodeToRange } from "./util.js";

export function hover(
	doc: DocumentLike,
	sourceFile: SourceFile,
	position: lst.Position,
): lst.Hover | undefined {
	const offset = doc.offsetAt(position);

	const g = sourceFile.graph;
	if (!g) return undefined;

	const node = findNodeAtOffset(g, offset);
	if (node === undefined) return undefined;

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
				case syntaxKind.NodeId: {
					// See https://github.com/nikeee/dot-language-support/issues/83
					if (n.symbol?.references) {
						const nodeIdentifierRefs = n.symbol?.references;
						const labelMentions = nodeIdentifierRefs.map(
							e =>
								e.symbol?.members?.get("label")?.firstMention.parent as
									| IdEqualsIdStatement
									| null
									| undefined,
						);
						for (let i = labelMentions.length; i >= 0; i--) {
							const s = labelMentions[i];
							if (s?.rightId) {
								return `(node) ${getIdentifierText(n)}: ${getIdentifierText(
									s.rightId,
								)}`;
							}
						}
					} else if (parent.parent?.kind === syntaxKind.NodeStatement) {
						const label = getAssignedLabel(parent.parent as NodeStatement);
						if (label) {
							return `(node) ${getIdentifierText(n)}: ${label}`;
						}
					}
					return `(node) ${getIdentifierText(n)}`;
				}
				case syntaxKind.Assignment: {
					const assignment = parent as Assignment;
					const left = getIdentifierText(assignment.leftId);
					const right = getIdentifierText(assignment.rightId);
					return `(assignment) \`${left}\` = \`${right}\``;
				}
				case syntaxKind.DirectedGraph:
					return getGraphHover(parent as Graph);
				case syntaxKind.UndirectedGraph:
					return getGraphHover(parent as Graph);
				case syntaxKind.SubGraphStatement: {
					const sgs = parent as SubGraphStatement;
					const sg = sgs.subgraph;
					return sg.id ? `(sub graph) ${getIdentifierText(sg.id)}` : "(sub graph)";
				}
				case syntaxKind.SubGraph: {
					const sg = parent as SubGraph;
					return sg.id ? `(sub graph) ${getIdentifierText(sg.id)}` : "(sub graph)";
				}
				case syntaxKind.IdEqualsIdStatement: {
					const idEqId = parent as IdEqualsIdStatement;
					const left = getIdentifierText(idEqId.leftId);
					const right = getIdentifierText(idEqId.rightId);
					return `(graph property) \`${left}\` = \`${right}\``;
				}
				case syntaxKind.EdgeRhs:
					return getEdgeHover(parent as EdgeRhs);
			}
			return syntaxKindNames[parent.kind];
		}

		const fallback = syntaxKindNames[n.kind];
		return fallback ? `(${fallback.toLowerCase()})` : undefined;
	}

	switch (n.kind) {
		case syntaxKind.GraphKeyword:
		case syntaxKind.DigraphKeyword:
		case syntaxKind.StrictKeyword:
			return getGraphHover(n.parent as Graph);

		// TODO: Why does findNodeAtOffset() return a non-leaf node
		// Did not expect to need to have this here.
		case syntaxKind.DirectedGraph:
		case syntaxKind.UndirectedGraph:
			return getGraphHover(n as Graph);

		case syntaxKind.DirectedEdgeOp:
		case syntaxKind.UndirectedEdgeOp:
			return getEdgeHover(n.parent as EdgeRhs);

		default:
			return undefined;
	}
}

function getGraphHover(g: Graph): string {
	const direction = g.kind === syntaxKind.DirectedGraph ? "directed" : "undirected";
	const graphId = g.id;
	const strict = g.strict ? "strict " : "";
	return graphId
		? `(${strict}${direction} graph) ${getIdentifierText(graphId)}`
		: `(${strict}${direction} graph)`;
}

function getEdgeHover(n: EdgeRhs) {
	const p = n.parent as EdgeStatement;
	if (!p || p.rhs.length === 0) return undefined;

	let source: EdgeSourceOrTarget | undefined;
	for (const curr of p.rhs) {
		if (curr === n) break;
		source = curr.target;
	}

	if (source === undefined) source = p.source;

	const edgeOpStr = getEdgeStr(n.operation.kind);

	return source === undefined
		? undefined
		: `(edge) ${getEdgeSourceOrTargetText(source)} ${edgeOpStr} ${getEdgeSourceOrTargetText(
				n.target,
			)}`;
}

function getEdgeSourceOrTargetText(n: EdgeSourceOrTarget): string {
	return n.kind === syntaxKind.NodeId
		? getIdentifierText(n.id)
		: n.id !== undefined
			? `${getIdentifierText(n.id)}`
			: "sub graph";
}
