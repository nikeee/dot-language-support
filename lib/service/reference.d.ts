import * as lst from "vscode-languageserver-types";
import { SourceFile } from "../types";
import { DocumentLike } from "../";
export declare function findReferences(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position, context: lst.ReferenceContext): lst.Location[];
export declare function findDefinition(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.Location | undefined;
