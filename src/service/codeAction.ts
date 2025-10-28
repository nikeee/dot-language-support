import type * as lst from "vscode-languageserver-types";
import {
	edgeStatementHasAttributes,
	findAllEdges,
	findNodeAtOffset,
	getAllowedEdgeOperation,
	getIdentifierText,
	isAttrStatement,
	isEdgeStatement,
	isNodeId,
	nodeContainsErrors,
} from "../checker.js";
import {
	checkError,
	type CheckErrorCode,
	type CommandApplication,
	type DiagnosticMessage,
	type DocumentLike,
	type EdgeStatement,
	errorSource,
	forEachChild,
	type Graph,
	isIdentifierNode,
	type ParseErrorCode,
	type ScanErrorCode,
	type SourceFile,
	syntaxKind,
	type SyntaxNode,
} from "../index.js";
import * as ChangeAllOtherEdgeOpsAndFixGraphCommand from "./command/ChangeAllOtherEdgeOpsAndFixGraphCommand.js";
import * as ChangeEdgeOpCommand from "./command/ChangeEdgeOpCommand.js";
import * as ConsolidateDescendantsCommand from "./command/ConsolidateDescendantsCommand.js";
import {
	type ExecutableCommand,
	getAllowedOp,
	getOppositeEdgeOp,
	getOppositeKind,
} from "./command/common.js";
import * as RemoveSemicolonsCommand from "./command/RemoveSemicolons.js";
import { assertNever, getStart } from "./util.js";

export function getCodeActions(
	doc: DocumentLike,
	sourceFile: SourceFile,
	range: lst.Range,
	_context?: lst.CodeActionContext,
): lst.Command[] | undefined {
	let actions = getActionsFromDiagnostics(doc, sourceFile, range);
	const general = getGeneralRefactorings(doc, sourceFile, range);
	if (general) {
		if (!actions) actions = general;
		else actions.push.apply(actions, general);
	}

	return actions;
}

function getActionsFromDiagnostics(
	doc: DocumentLike,
	file: SourceFile,
	range: lst.Range,
): lst.Command[] | undefined {
	const ds = file.diagnostics;
	if (!ds || ds.length === 0) return undefined;

	const rangeStartOffset = doc.offsetAt(range.start);
	const rangeEndOffset = doc.offsetAt(range.end);

	const res: lst.Command[] = [];
	for (const d of ds) {
		if (isInRange(rangeStartOffset, rangeEndOffset, d.start, d.end)) {
			// The code action request was for the error message range
			const commands = getCommandsForDiagnostic(doc, file, d);
			if (commands && commands.length > 0) res.push.apply(res, commands);
		}
	}
	return res.length === 0 ? undefined : res;
}

function getGeneralRefactorings(
	doc: DocumentLike,
	file: SourceFile,
	range: lst.Range,
): lst.Command[] | undefined {
	if (!file.graph) return undefined;

	const g = file.graph;
	const kw = g.keyword;

	const rangeStartOffset = doc.offsetAt(range.start);
	const rangeEndOffset = doc.offsetAt(range.end);

	const keywordStart = getStart(file, kw);

	// Check if the user clicked on "graph" or "digraph" so we can offer graph conversion

	const res = [];

	if (isInRange(rangeStartOffset, rangeEndOffset, keywordStart, kw.end)) {
		// Only offer graph refactoring if the graph has no errors
		if (!subtreeContainsErrors(g)) {
			const oppositeGraphType = getOppositeKind(kw.kind);
			const convertGraph = convertGraphTypeCommand(file, g, oppositeGraphType);
			res.push(convertGraph);
		}
	}

	if (rangeStartOffset === rangeEndOffset) {
		const candidates: EdgeStatement[] = [];

		let clickedNode = findNodeAtOffset(g, rangeStartOffset);
		if (clickedNode && !!clickedNode.parent) {
			if (clickedNode.kind === syntaxKind.SemicolonToken) {
				res.push(RemoveSemicolonsCommand.create());
			}

			if (isIdentifierNode(clickedNode)) {
				clickedNode = clickedNode.parent as SyntaxNode;
			}
			const clickedEdgeStatement = clickedNode.parent;
			if (clickedEdgeStatement && !subtreeContainsErrors(clickedEdgeStatement)) {
				if (
					isEdgeStatement(clickedEdgeStatement) &&
					clickedEdgeStatement.rhs.length === 1 &&
					isNodeId(clickedEdgeStatement.source) &&
					!edgeStatementHasAttributes(
						clickedEdgeStatement,
					) /* We only support edge statements that have no attributes */
				) {
					candidates.push(clickedEdgeStatement);

					// TODO: May use "getEdges"?

					const source = clickedEdgeStatement.source;
					const sourceText = getIdentifierText(source.id);

					const graphParent = clickedEdgeStatement.parent;
					if (graphParent) {
						let hasVisitedStatement = false;
						let hasVisitedNodeModifier = false;
						forEachChild(graphParent, statement => {
							if (statement === clickedEdgeStatement) {
								hasVisitedStatement = true;
								return undefined;
							}

							if (hasVisitedNodeModifier) {
								return;
							}
							if (hasVisitedStatement) {
								// If we have visited the clicked statement AND...
								if (
									isAttrStatement(statement) || // we have encountered a semantic-changing AttrStatement
									subtreeContainsErrors(statement) // ...or there is an error in the sub tree
								) {
									// ... then we want to stop here.

									// TODO: We may make this less strict, allowing graph modifications or something

									// We have visited a statement that changes the behavior of the following notes
									// We dont want to proceed here
									hasVisitedNodeModifier = true;
									return true;
								}
							}

							if (hasVisitedStatement) {
								if (
									isEdgeStatement(statement) &&
									statement.rhs.length === 1 &&
									!edgeStatementHasAttributes(
										statement,
									) /* We only support edge statements that have no attributes */
								) {
									const statementSource = statement.source;
									if (isNodeId(statementSource)) {
										const lowerSourceText = getIdentifierText(
											statementSource.id,
										);
										if (sourceText === lowerSourceText) {
											candidates.push(statement);
										}
									}
								}
							}
							return undefined;
						});
					}
				}

				if (candidates.length > 1) {
					const action = ConsolidateDescendantsCommand.create(candidates, true);
					res.push(action);
				}
			}
		}
	}

	return res.length === 0 ? undefined : res;
}

function getCommandsForDiagnostic(
	doc: DocumentLike,
	file: SourceFile,
	d: DiagnosticMessage,
): lst.Command[] | undefined {
	switch (d.code.source) {
		case errorSource.Scan:
			return getScannerErrorCommand(doc, file, d, d.code);
		case errorSource.Parse:
			return getParserErrorCommand(doc, file, d, d.code);
		case errorSource.Check:
			return getCheckerErrorCommand(doc, file, d, d.code);
		default:
			return assertNever(d.code);
	}
}
function getScannerErrorCommand(
	_doc: DocumentLike,
	_file: SourceFile,
	d: DiagnosticMessage,
	code: ScanErrorCode,
): lst.Command[] | undefined {
	console.assert(d.code.source === errorSource.Scan);
	console.assert(code.source === errorSource.Scan);
	return undefined; // TODO
}

function getParserErrorCommand(
	_doc: DocumentLike,
	_file: SourceFile,
	d: DiagnosticMessage,
	code: ParseErrorCode,
): lst.Command[] | undefined {
	console.assert(d.code.source === errorSource.Parse);
	console.assert(code.source === errorSource.Parse);
	return undefined; // TODO
}

function getCheckerErrorCommand(
	_doc: DocumentLike,
	file: SourceFile,
	d: DiagnosticMessage,
	code: CheckErrorCode,
): lst.Command[] | undefined {
	console.assert(d.code.source === errorSource.Check);
	console.assert(code.source === errorSource.Check);
	switch (code.sub) {
		case checkError.InvalidEdgeOperation: {
			const graph = file.graph;
			if (!graph) return undefined;

			const allowedOp = getAllowedEdgeOperation(graph);
			const wrongOp = getOppositeEdgeOp(allowedOp);

			const kwk = graph.keyword.kind;

			const fixSingleEdge = ChangeEdgeOpCommand.create(d.start, d.end, allowedOp, wrongOp);
			const fixAll = convertGraphTypeCommand(file, graph, kwk);
			const convertToThisWrongType = convertGraphTypeCommand(
				file,
				graph,
				getOppositeKind(kwk),
			);
			return [fixSingleEdge, fixAll, convertToThisWrongType];
		}
		case checkError.InvalidShapeName:
			return undefined; // Fixing spelling errors is not supported
	}
}

function convertGraphTypeCommand(
	file: SourceFile,
	graph: Graph,
	changeToGraphType: typeof syntaxKind.DigraphKeyword | typeof syntaxKind.GraphKeyword,
) {
	const changeToEdgeOp = getAllowedOp(changeToGraphType);

	const allEdges = findAllEdges(graph);
	const edgeOffsets = allEdges
		.filter(e => e.operation.kind !== changeToEdgeOp)
		.map(e => ({
			start: getStart(file, e.operation),
			end: e.operation.end,
		}));

	const graphTypeOffset = {
		start: getStart(file, graph.keyword),
		end: graph.keyword.end,
	};

	return ChangeAllOtherEdgeOpsAndFixGraphCommand.create(
		edgeOffsets,
		changeToEdgeOp,
		graphTypeOffset,
		graph.keyword.kind,
		changeToGraphType,
	);
}

function isInRange(
	rangeStartOffset: number,
	rangeEndOffset: number,
	startOffset: number,
	endOffset: number,
): boolean {
	if (rangeStartOffset === rangeEndOffset)
		return startOffset <= rangeStartOffset && rangeEndOffset <= endOffset;
	if (rangeStartOffset === startOffset && rangeEndOffset === endOffset) return true;
	return false; // TODO
}

export const commandIds = {
	ChangeEdgeOp: "DOT.changeEdgeOp",
	ConvertGraphType: "DOT.convertGraphType",
	ConsolidateDescendants: "DOT.consolidateDescendants",
	RemoveSemicolons: "DOT.removeSemicolons",
} as const;
export type CommandIds = (typeof commandIds)[keyof typeof commandIds];

type CommandHandler = (
	doc: DocumentLike,
	sourceFile: SourceFile,
	cmd: ExecutableCommand<unknown[]>,
) => CommandApplication | undefined;

interface CommandHandlers {
	[i: string]: CommandHandler;
}

const commandHandlers: CommandHandlers = {
	[commandIds.ChangeEdgeOp]: ChangeEdgeOpCommand.execute,
	[commandIds.ConvertGraphType]: ChangeAllOtherEdgeOpsAndFixGraphCommand.execute,
	[commandIds.ConsolidateDescendants]: ConsolidateDescendantsCommand.execute,
	[commandIds.RemoveSemicolons]: RemoveSemicolonsCommand.execute,
};

export function getAvailableCommands() {
	return Object.keys(commandHandlers);
}

export function executeCommand(
	doc: DocumentLike,
	sourceFile: SourceFile,
	cmd: ExecutableCommand<unknown[]>,
): CommandApplication | undefined {
	const handler = commandHandlers[cmd.command];
	return handler === undefined ? undefined : handler(doc, sourceFile, cmd);
}

function subtreeContainsErrors(node: SyntaxNode): boolean {
	if (nodeContainsErrors(node)) return true;

	let hasError = false;
	forEachChild(node, child => {
		if (nodeContainsErrors(child)) {
			hasError = true;
		}
		if (!hasError) {
			hasError = subtreeContainsErrors(child);
		}
	});
	return hasError;
}
