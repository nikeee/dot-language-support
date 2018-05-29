import * as lst from "vscode-languageserver-types";
import { SourceFile } from "../types";
import { DocumentLike } from "../";
export declare function getCompletions(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.CompletionItem[];
