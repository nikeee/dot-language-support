import type * as lst from "vscode-languageserver-types";

import { findNodeAtOffset, getIdentifierText } from "../checker.ts";
import type { DocumentLike, NodeStatement } from "../index.ts";
import { isIdentifierNode } from "../parser.ts";
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
} from "../types.ts";
import { getEdgeStr } from "./command/common.ts";
import { attributeDescriptions } from "./languageFacts.ts";
import { posRangeToRange } from "./util.ts";

interface HoverResult {
	contents: string;
	range?: { pos: number; end: number };
}

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
	const result = getHoverContents(n);

	if (result) {
		const { pos, end } = result.range ?? { pos: n.pos, end: n.end };
		return {
			contents: result.contents,
			range: posRangeToRange(doc, sf, pos, end),
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
function getHoverContents(n: SyntaxNode): HoverResult | undefined {
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
								return {
									contents: `(node) ${getIdentifierText(n)}: ${getIdentifierText(
										s.rightId,
									)}`,
								};
							}
						}
					} else if (parent.parent?.kind === syntaxKind.NodeStatement) {
						const label = getAssignedLabel(parent.parent as NodeStatement);
						if (label) {
							return { contents: `(node) ${getIdentifierText(n)}: ${label}` };
						}
					}
					return { contents: `(node) ${getIdentifierText(n)}` };
				}
				case syntaxKind.Assignment: {
					const assignment = parent as Assignment;
					const left = getIdentifierText(assignment.leftId);
					const right = getIdentifierText(assignment.rightId);
					const desc = attributeDescriptions[left.toLowerCase()];
					const base = `(assignment) \`${left}\` = \`${right}\``;
					return {
						contents: desc ? `${base}\n\n${desc}` : base,
						range: { pos: assignment.pos, end: assignment.end },
					};
				}
				case syntaxKind.DirectedGraph:
					return getGraphHover(parent as Graph);
				case syntaxKind.UndirectedGraph:
					return getGraphHover(parent as Graph);
				case syntaxKind.SubGraphStatement: {
					const sgs = parent as SubGraphStatement;
					const sg = sgs.subgraph;
					return {
						contents: sg.id ? `(sub graph) ${getIdentifierText(sg.id)}` : "(sub graph)",
						range: { pos: sgs.pos, end: sgs.end },
					};
				}
				case syntaxKind.SubGraph: {
					const sg = parent as SubGraph;
					return {
						contents: sg.id ? `(sub graph) ${getIdentifierText(sg.id)}` : "(sub graph)",
						range: { pos: sg.pos, end: sg.end },
					};
				}
				case syntaxKind.IdEqualsIdStatement: {
					const idEqId = parent as IdEqualsIdStatement;
					const left = getIdentifierText(idEqId.leftId);
					const right = getIdentifierText(idEqId.rightId);
					const desc = attributeDescriptions[left.toLowerCase()];
					const base = `(graph property) \`${left}\` = \`${right}\``;
					return {
						contents: desc ? `${base}\n\n${desc}` : base,
						range: { pos: idEqId.pos, end: idEqId.end },
					};
				}
				case syntaxKind.EdgeRhs:
					return getEdgeHover(parent as EdgeRhs);
			}
			const fallbackParent = syntaxKindNames[parent.kind];
			return fallbackParent ? { contents: fallbackParent } : undefined;
		}

		const fallback = syntaxKindNames[n.kind];
		return fallback ? { contents: `(${fallback.toLowerCase()})` } : undefined;
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

function getGraphHover(g: Graph): HoverResult {
	const direction = g.kind === syntaxKind.DirectedGraph ? "directed" : "undirected";
	const graphId = g.id;
	const strict = g.strict ? "strict " : "";
	const contents = graphId
		? `(${strict}${direction} graph) ${getIdentifierText(graphId)}`
		: `(${strict}${direction} graph)`;
	return { contents, range: { pos: g.pos, end: g.end } };
}

function getEdgeHover(n: EdgeRhs): HoverResult | undefined {
	const p = n.parent as EdgeStatement;
	if (!p || p.rhs.length === 0) return undefined;

	let source: EdgeSourceOrTarget | undefined;
	for (const curr of p.rhs) {
		if (curr === n) break;
		source = curr.target;
	}

	if (source === undefined) source = p.source;

	if (source === undefined) return undefined;

	const edgeOpStr = getEdgeStr(n.operation.kind);

	return {
		contents: `(edge) ${getEdgeSourceOrTargetText(source)} ${edgeOpStr} ${getEdgeSourceOrTargetText(
			n.target,
		)}`,
		range: { pos: source.pos, end: n.target.end },
	};
}

function getEdgeSourceOrTargetText(n: EdgeSourceOrTarget): string {
	return n.kind === syntaxKind.NodeId
		? getIdentifierText(n.id)
		: n.id !== undefined
			? `${getIdentifierText(n.id)}`
			: "sub graph";
}
