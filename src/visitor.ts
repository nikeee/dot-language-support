import {
	SyntaxNode,
	SyntaxNodeArray,
	SyntaxKind,
	Graph,
	AttributeStatement,
	EdgeStatement,
	NodeStatement,
	SubGraphStatement,
	QuotedTextIdentifier,
	NodeId,
	IdEqualsIdStatement,
	EdgeRhs,
	AttributeContainer,
	Assignment,
	NormalPointDeclaration,
	CompassPointDeclaration,
	SubGraph
} from "./types";

function visitNode<T>(cbNode: (node: SyntaxNode) => T, node?: SyntaxNode): T | undefined {
	return node && cbNode(node);
}

function visitNodes<T>(cbNode: (node: SyntaxNode) => T, cbNodes?: (node: SyntaxNodeArray<SyntaxNode>) => T, nodes?: SyntaxNodeArray<SyntaxNode>): T | undefined {
	if (nodes) {
		if (cbNodes)
			return cbNodes(nodes);

		for (const node of nodes) {
			const result = cbNode(node);
			if (result)
				return result;
		}
	}
	return undefined;
}

export function forEachChild<TReturn>(node: SyntaxNode, cbNode: (node: SyntaxNode) => TReturn, cbNodes?: (nodes: SyntaxNodeArray<SyntaxNode>) => TReturn): TReturn | undefined {
	if (!node || node.kind <= SyntaxKind.LastKeyword)
		return;

	switch (node.kind) {
		case SyntaxKind.DirectedGraph:
		case SyntaxKind.UndirectedGraph:
			return visitNodes(cbNode, cbNodes, (node as Graph).statements)
				|| visitNode(cbNode, (node as Graph).strict)
				|| visitNode(cbNode, (node as Graph).id);
		case SyntaxKind.AttributeStatement:
			return visitNodes(cbNode, cbNodes, (node as AttributeStatement).attributes)
				|| visitNode(cbNode, (node as AttributeStatement).subject)
				|| visitNode(cbNode, (node as AttributeStatement).terminator);
		case SyntaxKind.EdgeStatement:
			return visitNodes(cbNode, cbNodes, (node as EdgeStatement).attributes)
				|| visitNodes(cbNode, cbNodes, (node as EdgeStatement).rhs)
				|| visitNode(cbNode, (node as EdgeStatement).source)
				|| visitNode(cbNode, (node as EdgeStatement).terminator);
		case SyntaxKind.NodeStatement:
			return visitNodes(cbNode, cbNodes, (node as NodeStatement).attributes)
				|| visitNode(cbNode, (node as NodeStatement).id)
				|| visitNode(cbNode, (node as NodeStatement).terminator);
		case SyntaxKind.SubGraph:
			return visitNodes(cbNode, cbNodes, (node as SubGraph).statements)
				|| visitNode(cbNode, (node as SubGraph).id);
		case SyntaxKind.SubGraphStatement:
			return visitNode(cbNode, (node as SubGraphStatement).subgraph)
				|| visitNode(cbNode, (node as SubGraphStatement).terminator);
		case SyntaxKind.IdEqualsIdStatement:
			return visitNode(cbNode, (node as IdEqualsIdStatement).leftId)
				|| visitNode(cbNode, (node as IdEqualsIdStatement).rightId)
				|| visitNode(cbNode, (node as IdEqualsIdStatement).terminator);
		case SyntaxKind.QuotedTextIdentifier:
			return visitNodes(cbNode, cbNodes, (node as QuotedTextIdentifier).values);
		case SyntaxKind.EdgeRhs:
			return visitNode(cbNode, (node as EdgeRhs).operation)
				|| visitNode(cbNode, (node as EdgeRhs).target);
		case SyntaxKind.AttributeContainer:
			return visitNodes(cbNode, cbNodes, (node as AttributeContainer).assignments);
		case SyntaxKind.Assignment:
			return visitNode(cbNode, (node as Assignment).leftId)
				|| visitNode(cbNode, (node as Assignment).rightId)
				|| visitNode(cbNode, (node as Assignment).terminator);
		case SyntaxKind.NormalPointDeclaration:
			return visitNode(cbNode, (node as NormalPointDeclaration).colon)
				|| visitNode(cbNode, (node as NormalPointDeclaration).id)
				|| visitNode(cbNode, (node as NormalPointDeclaration).compassPt);
		case SyntaxKind.CompassPointDeclaration:
			return visitNode(cbNode, (node as CompassPointDeclaration).colon)
				|| visitNode(cbNode, (node as CompassPointDeclaration).compassPt);
		case SyntaxKind.NodeId:
			return visitNode(cbNode, (node as NodeId).point)
				|| visitNode(cbNode, (node as NodeId).id);
		default:
			return undefined;
		/*
		case SyntaxKind.DirectedEdgeOp:
		case SyntaxKind.UndirectedEdgeOp:
			return; // leave these out;
		default:
			throw "TODO: " + SyntaxKind[node.kind];
		*/
	}
}
