import * as lst from "vscode-languageserver-types";
import type { CommandApplication, DocumentLike, SourceFile } from "../../index.js";
import { commandIds } from "../codeAction.js";
import { type EdgeOpStr, type EdgeType, type ExecutableCommand, getEdgeStr } from "./common.js";

export interface ChangeEdgeOpCommand extends lst.Command {
	command: typeof commandIds.ChangeEdgeOp;
	arguments: [number, number, EdgeOpStr];
}

export function create(
	startOffset: number,
	endOffset: number,
	changeTo: EdgeType,
	changeFrom: EdgeType,
): ChangeEdgeOpCommand {
	const from = getEdgeStr(changeFrom);
	const to = getEdgeStr(changeTo);

	return {
		title: `Change "${from}" to "${to}".`,
		command: commandIds.ChangeEdgeOp,
		arguments: [startOffset, endOffset, to],
	};
}

export function execute(
	doc: DocumentLike,
	_sourceFile: SourceFile,
	cmd: ExecutableCommand<unknown[]>,
): CommandApplication | undefined {
	if (!isChangeEdgeOpCommand(cmd)) return undefined; // Invalid arguments

	const [startOffset, endOffset, changeTo] = cmd.arguments;

	const startPos = doc.positionAt(startOffset); // Safe to use startOffset here because the diagnostic uses "fullstart"
	const endPos = doc.positionAt(endOffset);

	return {
		label: `Change of invalid edge to "${changeTo}"'"`,
		edit: {
			changes: {
				[doc.uri]: [lst.TextEdit.replace(lst.Range.create(startPos, endPos), changeTo)],
			},
		},
	};
}

function isChangeEdgeOpCommand(cmd: ExecutableCommand<unknown[]>): cmd is ChangeEdgeOpCommand {
	return cmd.command === commandIds.ChangeEdgeOp && !!cmd.arguments && cmd.arguments.length === 3;
}
