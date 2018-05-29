import * as lst from "vscode-languageserver-types";
import { SyntaxKind } from "../../";
import { CommandIds } from "../codeAction";
export declare function createChangeToEdit(start: lst.Position, end: lst.Position, changeTo: string): lst.TextEdit;
export interface Offset {
    start: number;
    end: number;
}
export declare type ExecutableCommand = {
    command: CommandIds;
    arguments?: any[];
};
export declare type EdgeOpStr = "--" | "->";
export declare function getEdgeStr(op: SyntaxKind.UndirectedEdgeOp): "--";
export declare function getEdgeStr(op: SyntaxKind.DirectedEdgeOp): "->";
export declare function getEdgeStr(op: SyntaxKind.DirectedEdgeOp | SyntaxKind.UndirectedEdgeOp): "->" | "--";
export declare type GraphTypeStr = "graph" | "digraph";
export declare function getGraphKeywordStr(g: SyntaxKind.GraphKeyword): "graph";
export declare function getGraphKeywordStr(g: SyntaxKind.DigraphKeyword): "digraph";
export declare function getGraphKeywordStr(g: GraphType): "digraph" | "graph";
export declare type GraphType = SyntaxKind.DigraphKeyword | SyntaxKind.GraphKeyword;
export declare function getOppositeKind(g: SyntaxKind.DigraphKeyword): SyntaxKind.GraphKeyword;
export declare function getOppositeKind(g: SyntaxKind.GraphKeyword): SyntaxKind.DigraphKeyword;
export declare function getOppositeKind(g: GraphType): GraphType;
export declare type EdgeType = SyntaxKind.DirectedEdgeOp | SyntaxKind.UndirectedEdgeOp;
export declare function getOppositeEdgeOp(g: SyntaxKind.DirectedEdgeOp): SyntaxKind.UndirectedEdgeOp;
export declare function getOppositeEdgeOp(g: SyntaxKind.UndirectedEdgeOp): SyntaxKind.DirectedEdgeOp;
export declare function getOppositeEdgeOp(g: EdgeType): EdgeType;
export declare function getAllowedOp(g: SyntaxKind.GraphKeyword): SyntaxKind.UndirectedEdgeOp;
export declare function getAllowedOp(g: SyntaxKind.DigraphKeyword): SyntaxKind.DirectedEdgeOp;
export declare function getAllowedOp(g: GraphType): EdgeType;
