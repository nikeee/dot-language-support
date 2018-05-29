import { SyntaxNode, SyntaxNodeArray } from "./types";
export declare function forEachChild<TReturn>(node: SyntaxNode, cbNode: (node: SyntaxNode) => TReturn, cbNodes?: (nodes: SyntaxNodeArray<SyntaxNode>) => TReturn): TReturn | undefined;
