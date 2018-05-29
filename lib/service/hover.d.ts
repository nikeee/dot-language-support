import * as lst from "vscode-languageserver-types";
import { SourceFile } from "../types";
import { DocumentLike } from "../";
export declare function hover(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.Hover | undefined;
