import * as lst from "vscode-languageserver-types";
import { DocumentLike, SourceFile, CommandApplication } from "../";
import { ExecutableCommand } from "./command/common";
export declare function getCodeActions(doc: DocumentLike, sourceFile: SourceFile, range: lst.Range, context: lst.CodeActionContext): lst.Command[] | undefined;
export declare const enum CommandIds {
    ChangeEdgeOp = "DOT.changeEdgeOp",
    ConvertGraphType = "DOT.convertGraphType",
    ConsolidateDescendants = "DOT.consolidateDescendants",
}
export declare function getAvailableCommands(): string[];
export declare function executeCommand(doc: DocumentLike, sourceFile: SourceFile, cmd: ExecutableCommand): CommandApplication | undefined;
