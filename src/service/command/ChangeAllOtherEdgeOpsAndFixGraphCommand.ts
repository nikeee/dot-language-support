import * as lst from "vscode-languageserver-types";
import { CommandIds } from "../codeAction";
import { GraphTypeStr, Offset, EdgeOpStr, createChangeToEdit, ExecutableCommand, getEdgeStr, EdgeType, GraphType, getGraphKeywordStr } from "./common";
import { DocumentLike, SourceFile, CommandApplication, SyntaxKind } from "../../";

export interface ChangeAllOtherEdgeOpsAndFixGraphCommand extends lst.Command {
	command: CommandIds.ConvertGraphType;
	arguments: [Offset[], EdgeOpStr, Offset, GraphTypeStr];
}

export function create(edgeOffsets: Offset[], changeEdgesTo: EdgeType, graphOffset: Offset, changeFromGraph: GraphType, changeGraphTo: GraphType): ChangeAllOtherEdgeOpsAndFixGraphCommand {

	const toGraph = getGraphKeywordStr(changeGraphTo);
	const title = changeGraphTo === changeFromGraph
		? `Fix all edges to match ${toGraph}`
		: `Convert ${getGraphKeywordStr(changeFromGraph)} to ${toGraph}`;

	const edgeStr = getEdgeStr(changeEdgesTo);
	return {
		title,
		command: CommandIds.ConvertGraphType,
		arguments: [edgeOffsets, edgeStr, graphOffset, toGraph],
	};
}

export function execute(doc: DocumentLike, sourceFile: SourceFile, cmd: ExecutableCommand): CommandApplication | undefined {
	if (!isChangeAllOtherEdgeOpsAndFixGraphCommand(cmd))
		return undefined;

	const [edgeOffsets, changeEdgeTo, graphOffset, changeGraphTo] = cmd.arguments;

	const edits = edgeOffsets.map(o => {
		const startPos = doc.positionAt(o.start); // Safe to use startOffset here because the diagnostic uses "fullstart"
		const endPos = doc.positionAt(o.end);
		return createChangeToEdit(startPos, endPos, changeEdgeTo);
	});

	const graphStart = doc.positionAt(graphOffset.start);
	const graphEnd = doc.positionAt(graphOffset.end);
	edits.push(createChangeToEdit(graphStart, graphEnd, changeGraphTo));

	return {
		label: `Convert graph to "${changeGraphTo}"`,
		edit: {
			changes: {
				[doc.uri]: edits,
			}
		}
	};
}

function isChangeAllOtherEdgeOpsAndFixGraphCommand(cmd: ExecutableCommand): cmd is ChangeAllOtherEdgeOpsAndFixGraphCommand {
	return cmd.command === CommandIds.ConvertGraphType && !!cmd.arguments && cmd.arguments.length === 4;
}
