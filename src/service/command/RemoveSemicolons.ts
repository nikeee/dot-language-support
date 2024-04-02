import * as lst from "vscode-languageserver-types";
import { CommandIds } from "../codeAction.js";
import { createChangeToEdit, ExecutableCommand } from "./common.js";
import { DocumentLike, SourceFile, CommandApplication } from "../../index.js";
import { findOptionalSemicolons } from "../../checker.js";

export interface RemoveSemicolonsCommand extends lst.Command {
	command: CommandIds.RemoveSemicolons;
	arguments: undefined;
}

export function create(): RemoveSemicolonsCommand {
	return {
		title: "Remove optional semicolons",
		command: CommandIds.RemoveSemicolons,
		arguments: undefined,
	};
}

export function execute(
	doc: DocumentLike,
	sourceFile: SourceFile,
	cmd: ExecutableCommand,
): CommandApplication | undefined {
	if (!isRemoveSemicolonsCommand(cmd)) return undefined;

	const g = sourceFile.graph;
	if (!g) return undefined;

	const semicolons = findOptionalSemicolons(g);

	const edits = semicolons.map(s => {
		const end = s.end;
		const start = end - 1; // Safe, because semicolons are exactly 1 char
		return createChangeToEdit(doc.positionAt(start), doc.positionAt(end), "");
	});

	return {
		label: `Remove optional semicolons`,
		edit: {
			changes: {
				[doc.uri]: edits,
			},
		},
	};
}

function isRemoveSemicolonsCommand(cmd: ExecutableCommand): cmd is RemoveSemicolonsCommand {
	return (
		cmd.command === CommandIds.RemoveSemicolons &&
		(!cmd.arguments || cmd.arguments.length === 0 || cmd.arguments.every(e => e === undefined))
	);
}
