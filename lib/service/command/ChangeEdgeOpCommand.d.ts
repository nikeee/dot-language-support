import * as lst from "vscode-languageserver-types";
import { CommandIds } from "../codeAction";
import { EdgeOpStr, ExecutableCommand, EdgeType } from "./common";
import { DocumentLike, SourceFile, CommandApplication } from "../../";
export interface ChangeEdgeOpCommand extends lst.Command {
    command: CommandIds.ChangeEdgeOp;
    arguments: [number, number, EdgeOpStr];
}
export declare function create(startOffset: number, endOffset: number, changeTo: EdgeType, changeFrom: EdgeType): ChangeEdgeOpCommand;
export declare function execute(doc: DocumentLike, sourceFile: SourceFile, cmd: ExecutableCommand): CommandApplication | undefined;
