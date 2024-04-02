import { TextEdit, Range, type Position } from "vscode-languageserver-types";
import { SyntaxKind } from "../../index.js";
import { CommandIds } from "../codeAction.js";

export function createChangeToEdit(start: Position, end: Position, changeTo: string): TextEdit {
	return TextEdit.replace(Range.create(start, end), changeTo);
}

export interface Offset {
	start: number;
	end: number;
}

export type ExecutableCommand = {
	command: CommandIds;
	arguments?: any[];
};

export type EdgeOpStr = "--" | "->";
export function getEdgeStr(op: SyntaxKind.UndirectedEdgeOp): "--";
export function getEdgeStr(op: SyntaxKind.DirectedEdgeOp): "->";
export function getEdgeStr(
	op: SyntaxKind.DirectedEdgeOp | SyntaxKind.UndirectedEdgeOp,
): "->" | "--";
export function getEdgeStr(
	op: SyntaxKind.DirectedEdgeOp | SyntaxKind.UndirectedEdgeOp,
): "->" | "--" {
	return op === SyntaxKind.DirectedEdgeOp ? "->" : "--";
}

export type GraphTypeStr = "graph" | "digraph";
export function getGraphKeywordStr(g: SyntaxKind.GraphKeyword): "graph";
export function getGraphKeywordStr(g: SyntaxKind.DigraphKeyword): "digraph";
export function getGraphKeywordStr(g: GraphType): "digraph" | "graph";
export function getGraphKeywordStr(g: GraphType): "digraph" | "graph" {
	return g === SyntaxKind.DigraphKeyword ? "digraph" : "graph";
}

export type GraphType = SyntaxKind.DigraphKeyword | SyntaxKind.GraphKeyword;
export function getOppositeKind(g: SyntaxKind.DigraphKeyword): SyntaxKind.GraphKeyword;
export function getOppositeKind(g: SyntaxKind.GraphKeyword): SyntaxKind.DigraphKeyword;
export function getOppositeKind(g: GraphType): GraphType;
export function getOppositeKind(g: GraphType): GraphType {
	return g === SyntaxKind.DigraphKeyword ? SyntaxKind.GraphKeyword : SyntaxKind.DigraphKeyword;
}

export type EdgeType = SyntaxKind.DirectedEdgeOp | SyntaxKind.UndirectedEdgeOp;
export function getOppositeEdgeOp(g: SyntaxKind.DirectedEdgeOp): SyntaxKind.UndirectedEdgeOp;
export function getOppositeEdgeOp(g: SyntaxKind.UndirectedEdgeOp): SyntaxKind.DirectedEdgeOp;
export function getOppositeEdgeOp(g: EdgeType): EdgeType;
export function getOppositeEdgeOp(g: EdgeType): EdgeType {
	return g === SyntaxKind.DirectedEdgeOp
		? SyntaxKind.UndirectedEdgeOp
		: SyntaxKind.DirectedEdgeOp;
}

export function getAllowedOp(g: SyntaxKind.GraphKeyword): SyntaxKind.UndirectedEdgeOp;
export function getAllowedOp(g: SyntaxKind.DigraphKeyword): SyntaxKind.DirectedEdgeOp;
export function getAllowedOp(g: GraphType): EdgeType;
export function getAllowedOp(g: GraphType): EdgeType {
	return g === SyntaxKind.DigraphKeyword
		? SyntaxKind.DirectedEdgeOp
		: SyntaxKind.UndirectedEdgeOp;
}
