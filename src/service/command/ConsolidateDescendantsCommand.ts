import type * as lst from "vscode-languageserver-types";
import { findNodeAtOffset, getIdentifierText } from "../../checker.js";
import type {
	CommandApplication,
	DocumentLike,
	EdgeStatement,
	NodeId,
	SourceFile,
	SyntaxNode,
} from "../../index.js";
import { commandIds } from "../codeAction.js";
import { getStart } from "../util.js";
import type { ExecutableCommand } from "./common.js";

export interface ConsolidateDescendantsCommand extends lst.Command {
	command: typeof commandIds.ConsolidateDescendants;
	arguments: number[];
}

export function create(statements: EdgeStatement[], below: boolean): ConsolidateDescendantsCommand {
	const first = statements[0];
	const from = getIdentifierText((first.source as NodeId).id);
	const title = below
		? `Convert edges below from "${from}" to subgraph`
		: `Convert edges from "${from}" to subgraph`;
	return {
		title,
		command: commandIds.ConsolidateDescendants,
		arguments: statements.map(s => s.pos),
	};
}

export function execute(
	doc: DocumentLike,
	sourceFile: SourceFile,
	cmd: ExecutableCommand<unknown[]>,
): CommandApplication | undefined {
	if (!isConsolidateDescendantsCommand(cmd)) return undefined; // Invalid arguments

	const g = sourceFile.graph;
	if (!g) return undefined;

	const candidateIndexes = cmd.arguments as number[];
	const candidates = candidateIndexes.map(
		i => ((findNodeAtOffset(g, i) as SyntaxNode).parent as SyntaxNode).parent as EdgeStatement,
	);

	const first = candidates.shift() as EdgeStatement;
	const from = getIdentifierText((first.source as NodeId).id);

	const edits: lst.TextEdit[] = [];
	const firstRight = first.rhs[0];
	const firstRightTargetStart = getStart(sourceFile, firstRight.target);
	const firstRightTargetEnd = firstRight.target.end;

	const contents = [sourceFile.content.substring(firstRightTargetStart, firstRightTargetEnd)];

	for (const descendant of candidates) {
		// descendant.
		const rightItem = descendant.rhs[0];
		const rightItemTarget = rightItem.target;

		const rightItemTargetStart = rightItemTarget.pos; // getStart(sourceFile, rightItemTarget);

		const rightItemTargetEnd = rightItem.target.end;
		const rightItemContent = sourceFile.content.substring(
			rightItemTargetStart,
			rightItemTargetEnd,
		);

		edits.push({
			newText: "",
			range: {
				start: doc.positionAt(descendant.pos),
				end: doc.positionAt(rightItemTargetStart),
			},
		}); // Remove stuff before item

		edits.push({
			newText: "",
			range: {
				start: doc.positionAt(rightItemTargetStart),
				end: doc.positionAt(rightItemTargetEnd),
			},
		}); // Remove item itself

		if (descendant.terminator !== undefined) {
			edits.push({
				newText: "",
				range: {
					start: doc.positionAt(getStart(sourceFile, descendant.terminator)),
					end: doc.positionAt(descendant.terminator.end),
				},
			}); // Remove terminator of node id
		}

		contents.push(rightItemContent);
	}

	const toInsert = `{ ${contents.map(s => s.trim()).join(" ")} }`;

	edits.push({
		newText: toInsert,
		range: {
			start: doc.positionAt(firstRightTargetStart),
			end: doc.positionAt(firstRightTargetEnd),
		},
	}); // Replace old target with new subgraph

	return {
		label: `Convert edges from "${from}" to subgraph.`,
		edit: {
			changes: {
				[doc.uri]: edits,
			},
		},
	};
}

function isConsolidateDescendantsCommand(
	cmd: ExecutableCommand<unknown[]>,
): cmd is ConsolidateDescendantsCommand {
	return (
		cmd.command === commandIds.ConsolidateDescendants &&
		!!cmd.arguments &&
		cmd.arguments.length > 1
	);
}
