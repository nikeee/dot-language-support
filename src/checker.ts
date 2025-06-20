import { shapes as validShapes } from "./service/languageFacts.js";
import { assertNever, getStart } from "./service/util.js";
import {
	type Assignment,
	type AttributeStatement,
	CheckError,
	type CheckErrorCode,
	DiagnosticCategory,
	type DiagnosticMessage,
	type EdgeOp,
	type EdgeRhs,
	type EdgeStatement,
	ErrorSource,
	type Graph,
	type Identifier,
	type NodeId,
	type SourceFile,
	type Statement,
	type StatementOf,
	type SubGraphStatement,
	SyntaxKind,
	type SyntaxNode,
	type SyntaxNodeArray,
	SyntaxNodeFlags,
	type TextIdentifier,
	type TextRange,
	type Token,
} from "./types.js";
import { forEachChild } from "./visitor.js";

export function checkSourceFile(file: SourceFile): void {
	const g = file.graph;

	if (g) {
		const messages = checkGraphSemantics(file, g);
		if (messages) {
			// better performance than file.diagnostics.push(...messages);
			file.diagnostics.push.apply(file.diagnostics, messages);
		}
	}
}

// biome-ignore lint/correctness/noUnusedVariables: todo
function getNarrowerNode(offset: number, prev: SyntaxNode, toCheck: SyntaxNode): SyntaxNode {
	const prevRange = prev.end - prev.pos;

	if (toCheck.pos <= offset && offset <= toCheck.end) {
		const nrange = toCheck.end - toCheck.pos;
		if (nrange < prevRange) {
			return toCheck;
		}
	}
	return prev;
}

function rangeContainsOffset(range: TextRange, offset: number, inclusiveEnd: boolean) {
	return inclusiveEnd
		? range.pos <= offset && offset <= range.end
		: range.pos <= offset && offset < range.end;
}

// TODO: inclusiveEnd seems a hack to me. We shoudl remove that later.
export function findNodeAtOffset(
	root: SyntaxNode,
	offset: number,
	inclusiveEnd = false,
): SyntaxNode | undefined {
	// Wow, I don't think this actually works. But it seems to.

	// TODO: Fix this, this methods throws sometimes

	if (root.pos === offset && root.pos === root.end) return root;

	// Check if the current checked contains the passed offset
	if (rangeContainsOffset(root, offset, inclusiveEnd)) {
		const narrowerChild = forEachChild(root, child =>
			findNodeAtOffset(child, offset, inclusiveEnd),
		);

		return narrowerChild ? narrowerChild : root;
	}
	return undefined;
}

export function getAllowedEdgeOperation(graph: Graph) {
	return graph.kind === SyntaxKind.DirectedGraph
		? SyntaxKind.DirectedEdgeOp
		: SyntaxKind.UndirectedEdgeOp;
}

function checkGraphSemantics(file: SourceFile, root: Graph): DiagnosticMessage[] | undefined {
	const expectedEdgeOp = getAllowedEdgeOperation(root);

	const invalidEdgeRhses = findEdgeErrors(expectedEdgeOp, root);

	const invalidShapes = checkShapeLabelValues(root);

	const invalidEdgeDiagnostics =
		invalidEdgeRhses === undefined || invalidEdgeRhses.length === 0
			? []
			: createEdgeViolationDiagnostics(file, expectedEdgeOp, invalidEdgeRhses);

	return [...invalidEdgeDiagnostics, ...invalidShapes];
}

function forEachAssignmentTransitive(root: SyntaxNode, cb: (assignment: Assignment) => void) {
	forEachChild(root, child => {
		if (child.kind === SyntaxKind.Assignment) {
			cb(child as Assignment);
			return;
		}

		forEachChild(child, c => forEachAssignmentTransitive(c, cb));
	});
}

function checkShapeLabelValues(root: SyntaxNode): DiagnosticMessage[] {
	const invalidShapes: DiagnosticMessage[] = [];

	forEachAssignmentTransitive(root, assignment => {
		const { leftId, rightId } = assignment;
		if (
			leftId.kind !== SyntaxKind.TextIdentifier ||
			rightId.kind !== SyntaxKind.TextIdentifier
		) {
			return;
		}

		const leftText = (leftId as TextIdentifier).text.trim();

		if (leftText.toLocaleLowerCase() !== "shape") {
			return;
		}

		const rightText = (rightId as TextIdentifier).text.trim();
		const shapeCandidate = rightText.toLowerCase();
		if (validShapes.includes(shapeCandidate)) {
			return;
		}

		invalidShapes.push({
			category: DiagnosticCategory.Warning,
			code: createCheckerError(CheckError.InvalidShapeName),
			message: `Unknown shape "${rightText}".`,
			start: rightId.pos,
			end: rightId.end,
		});
	});

	return invalidShapes;
}

/**
 * TOOD: Refactor to use findAllSatements internally
 * @param node
 */
export function findAllEdges(node: SyntaxNode): EdgeRhs[] {
	const allEdges: EdgeRhs[] = [];
	forEachChild(node, child => {
		if (isEdgeStatement(child)) {
			if (child.rhs && child.rhs.length > 0) {
				// Was:
				// allEdges.push.apply(allEdges, child.rhs);
				// Since TypeScript 3.2, the apply call is checked aswell. child.rhs is no genuine EdgeRhs[] (it contains additional data)
				// So we're pushing the items one-by-one here.
				for (const edgeRhs of child.rhs) allEdges.push(edgeRhs);
			}
		}

		const childEdges = findAllEdges(child);
		if (childEdges && childEdges.length > 0) allEdges.push.apply(allEdges, childEdges);
	});

	return allEdges;
}

export function findOptionalSemicolons(node: SyntaxNode): Token<SyntaxKind.SemicolonToken>[] {
	const statements = findAllStatements(node);
	const terminators = statements.map(p => p.terminator);
	return terminators.filter(t => !!t) as Token<SyntaxKind.SemicolonToken>[];
}

function isStatement(node: SyntaxNode): node is Statement {
	return (
		node.kind === SyntaxKind.SubGraphStatement ||
		node.kind === SyntaxKind.EdgeStatement ||
		node.kind === SyntaxKind.NodeStatement ||
		node.kind === SyntaxKind.IdEqualsIdStatement ||
		node.kind === SyntaxKind.AttributeStatement
	);
}

export function findAllStatements<T extends Statement["kind"]>(
	node: SyntaxNode,
	kind?: T,
): StatementOf<T>[] {
	const allStatements: StatementOf<T>[] = [];

	forEachChild(node, child => {
		// If no kind is provided and the child is a statement
		// ...or the child.kind is the requested kind
		if ((kind === undefined && isStatement(child)) || child.kind === kind) {
			allStatements.push(child as StatementOf<T>);
		}

		const childStatements = findAllStatements(child, kind);
		if (childStatements && childStatements.length > 0)
			allStatements.push.apply(allStatements, childStatements);
	});

	return allStatements;
}

/*
export function findAllEdges(node: SyntaxNode): EdgeRhs[] {
	const allEdges = forEachChild(node, child => {
		const childEdges: EdgeRhs[] = [];
		console.debug(SyntaxKind[node.kind] + ": " + SyntaxKind[child.kind]);

		if (isEdgeStatement(child)) {
			if (child.rhs) {
				childEdges.push.apply(childEdges, child.rhs);
			}
		}

		const childEdgesOfChild = findAllEdges(child);
		if (childEdgesOfChild && childEdgesOfChild.length > 0)
			childEdges.push.apply(childEdges, childEdgesOfChild);
		return childEdges;
	});
	return allEdges !== undefined ? allEdges : [];
}
*/

function findEdgeErrors(expectedEdgeOp: EdgeOp["kind"], node: SyntaxNode): EdgeRhs[] | undefined {
	const edges = findAllEdges(node);

	const wrongEdges =
		edges && edges.length > 0
			? edges.filter(e => e.operation.kind !== expectedEdgeOp)
			: undefined;

	if (wrongEdges && wrongEdges.length > 0) {
		for (const edge of wrongEdges) {
			edge.operation.flags |= SyntaxNodeFlags.ContainsErrors;
		}
		return wrongEdges;
	}
	return undefined;
}

function createEdgeViolationDiagnostics(
	file: SourceFile,
	expectedEdgeOp: EdgeOp["kind"],
	violators: EdgeRhs[],
): DiagnosticMessage[] {
	const op = expectedEdgeOp === SyntaxKind.UndirectedEdgeOp ? "--" : "->";
	const graphType = expectedEdgeOp === SyntaxKind.UndirectedEdgeOp ? "undirected" : "directed";

	const message = `Invalid edge operation, use "${op}" in ${graphType} graph`;
	const code = createCheckerError(CheckError.InvalidEdgeOperation);
	const category = DiagnosticCategory.Error;

	// Add flags in side-effected forEach instead of map() below
	for (const edge of violators) {
		edge.operation.flags |= SyntaxNodeFlags.ContainsErrors;
	}

	return violators.map(edge => {
		const start = getStart(file, edge.operation);
		const end = edge.operation.end;

		return {
			message,
			code,
			category,
			start,
			end,
		};
	});
}

// biome-ignore lint/correctness/noUnusedVariables: todo
function getInvalidEdgeRhs(allowedOp: EdgeOp["kind"], edges: SyntaxNodeArray<EdgeRhs>): EdgeRhs[] {
	const res = [];
	for (const e of edges) {
		if (e.operation.kind !== allowedOp) res.push(e);
	}
	return res;
}

export function isAttrStatement(node: SyntaxNode): node is AttributeStatement {
	return node.kind === SyntaxKind.AttributeStatement;
}
export function isEdgeStatement(node: SyntaxNode): node is EdgeStatement {
	return node.kind === SyntaxKind.EdgeStatement;
}
export function isSubGraphStatement(node: SyntaxNode): node is SubGraphStatement {
	return node.kind === SyntaxKind.SubGraphStatement;
}
export function isGraph(node: SyntaxNode): node is Graph {
	return node.kind === SyntaxKind.DirectedGraph || node.kind === SyntaxKind.UndirectedGraph;
}
export function isNodeId(node: SyntaxNode): node is NodeId {
	return node.kind === SyntaxKind.NodeId;
}
export function edgeStatementHasAttributes(es: EdgeStatement) {
	return (
		es.attributes &&
		es.attributes.length > 0 &&
		es.attributes.some(a => a.assignments && a.assignments.length > 0)
	);
}

export function getIdentifierText(n: Identifier): string {
	switch (n.kind) {
		case SyntaxKind.HtmlIdentifier:
			return n.htmlContent;
		case SyntaxKind.TextIdentifier:
			return n.text;
		case SyntaxKind.NumericIdentifier:
			return n.text;
		case SyntaxKind.QuotedTextIdentifier:
			return n.concatenation as string; // Assertion because concatenation is filled in binding step
		default:
			return assertNever(n);
	}
}

function createCheckerError(sub: CheckError): CheckErrorCode {
	return {
		source: ErrorSource.Check,
		sub,
	};
}

export function nodeContainsErrors(node: SyntaxNode): boolean {
	return (node.flags & SyntaxNodeFlags.ContainsErrors) === SyntaxNodeFlags.ContainsErrors;
}
