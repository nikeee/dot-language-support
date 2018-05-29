import * as lst from "vscode-languageserver-types";
import { SourceFile, SyntaxNode } from "../types";
import { DocumentLike } from "../";
export declare function getStart(sourceFile: SourceFile, node: SyntaxNode): number;
export declare function syntaxNodesToRanges(doc: DocumentLike, sourceFile: SourceFile, nodes: SyntaxNode[]): lst.Range[];
export declare function syntaxNodeToRange(doc: DocumentLike, sourceFile: SourceFile, node: SyntaxNode): {
    start: lst.Position;
    end: lst.Position;
};
export declare function escapeIdentifierText(text: string): string;
export declare function assertNever(n: never): never;
