import * as lst from "vscode-languageserver-types";
import { CommandIds } from "../codeAction";
import { GraphTypeStr, Offset, EdgeOpStr, ExecutableCommand, EdgeType, GraphType } from "./common";
import { DocumentLike, SourceFile, CommandApplication } from "../../";
export interface ChangeAllOtherEdgeOpsAndFixGraphCommand extends lst.Command {
    command: CommandIds.ConvertGraphType;
    arguments: [Offset[], EdgeOpStr, Offset, GraphTypeStr];
}
export declare function create(edgeOffsets: Offset[], changeEdgesTo: EdgeType, graphOffset: Offset, changeFromGraph: GraphType, changeGraphTo: GraphType): ChangeAllOtherEdgeOpsAndFixGraphCommand;
export declare function execute(doc: DocumentLike, sourceFile: SourceFile, cmd: ExecutableCommand): CommandApplication | undefined;
