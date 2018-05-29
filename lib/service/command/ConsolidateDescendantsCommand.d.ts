import * as lst from "vscode-languageserver-types";
import { CommandIds } from "../codeAction";
import { ExecutableCommand } from "./common";
import { DocumentLike, SourceFile, CommandApplication, EdgeStatement } from "../../";
export interface ConsolidateDescendantsCommand extends lst.Command {
    command: CommandIds.ConsolidateDescendants;
    arguments: number[];
}
export declare function create(statements: EdgeStatement[], below: boolean): ConsolidateDescendantsCommand;
export declare function execute(doc: DocumentLike, sourceFile: SourceFile, cmd: ExecutableCommand): CommandApplication | undefined;
