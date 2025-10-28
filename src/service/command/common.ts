import { type Position, Range, TextEdit } from "vscode-languageserver-types";

import { syntaxKind } from "../../index.ts";
import type { CommandIds } from "../codeAction.ts";

export function createChangeToEdit(start: Position, end: Position, changeTo: string): TextEdit {
	return TextEdit.replace(Range.create(start, end), changeTo);
}

export interface Offset {
	start: number;
	end: number;
}

export type ExecutableCommand<TArgs> = {
	command: CommandIds;
	arguments?: TArgs;
};

export type EdgeOpStr = "--" | "->";
export function getEdgeStr(op: typeof syntaxKind.UndirectedEdgeOp): "--";
export function getEdgeStr(op: typeof syntaxKind.DirectedEdgeOp): "->";
export function getEdgeStr(
	op: typeof syntaxKind.DirectedEdgeOp | typeof syntaxKind.UndirectedEdgeOp,
): "->" | "--";
export function getEdgeStr(
	op: typeof syntaxKind.DirectedEdgeOp | typeof syntaxKind.UndirectedEdgeOp,
): "->" | "--" {
	return op === syntaxKind.DirectedEdgeOp ? "->" : "--";
}

export type GraphTypeStr = "graph" | "digraph";
export function getGraphKeywordStr(g: typeof syntaxKind.GraphKeyword): "graph";
export function getGraphKeywordStr(g: typeof syntaxKind.DigraphKeyword): "digraph";
export function getGraphKeywordStr(g: GraphType): "digraph" | "graph";
export function getGraphKeywordStr(g: GraphType): "digraph" | "graph" {
	return g === syntaxKind.DigraphKeyword ? "digraph" : "graph";
}

export type GraphType = typeof syntaxKind.DigraphKeyword | typeof syntaxKind.GraphKeyword;
export function getOppositeKind(
	g: typeof syntaxKind.DigraphKeyword,
): typeof syntaxKind.GraphKeyword;
export function getOppositeKind(
	g: typeof syntaxKind.GraphKeyword,
): typeof syntaxKind.DigraphKeyword;
export function getOppositeKind(g: GraphType): GraphType;
export function getOppositeKind(g: GraphType): GraphType {
	return g === syntaxKind.DigraphKeyword ? syntaxKind.GraphKeyword : syntaxKind.DigraphKeyword;
}

export type EdgeType = typeof syntaxKind.DirectedEdgeOp | typeof syntaxKind.UndirectedEdgeOp;
export function getOppositeEdgeOp(
	g: typeof syntaxKind.DirectedEdgeOp,
): typeof syntaxKind.UndirectedEdgeOp;
export function getOppositeEdgeOp(
	g: typeof syntaxKind.UndirectedEdgeOp,
): typeof syntaxKind.DirectedEdgeOp;
export function getOppositeEdgeOp(g: EdgeType): EdgeType;
export function getOppositeEdgeOp(g: EdgeType): EdgeType {
	return g === syntaxKind.DirectedEdgeOp
		? syntaxKind.UndirectedEdgeOp
		: syntaxKind.DirectedEdgeOp;
}

export function getAllowedOp(g: typeof syntaxKind.GraphKeyword): typeof syntaxKind.UndirectedEdgeOp;
export function getAllowedOp(g: typeof syntaxKind.DigraphKeyword): typeof syntaxKind.DirectedEdgeOp;
export function getAllowedOp(g: GraphType): EdgeType;
export function getAllowedOp(g: GraphType): EdgeType {
	return g === syntaxKind.DigraphKeyword
		? syntaxKind.DirectedEdgeOp
		: syntaxKind.UndirectedEdgeOp;
}
