import * as lst from "vscode-languageserver-types";
import { SourceFile } from "../types";
import { DocumentLike } from "../";
export declare function renameSymbol(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position, newName: string): lst.WorkspaceEdit | undefined;
