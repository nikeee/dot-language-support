import * as lst from "vscode-languageserver-types";
import { SourceFile } from "../types";
import { DocumentLike } from "../";
export declare function validateDocument(doc: DocumentLike, sourceFile: SourceFile): lst.Diagnostic[];
