import type { TextDocument } from "vscode-languageserver-textdocument";
import type * as lst from "vscode-languageserver-types";
import type { Color, ColorInformation, ColorPresentation } from "vscode-languageserver-types";

import { bindSourceFile } from "../binder.ts";
import { checkSourceFile } from "../checker.ts";
import { Parser } from "../index.ts";
import type { Omit, SourceFile } from "../types.ts";
import { executeCommand, getAvailableCommands, getCodeActions } from "./codeAction.ts";
import { getColorRepresentations, getDocumentColors } from "./colorProvider.ts";
import { getCompletions } from "./completion.ts";
import { hover } from "./hover.ts";
import { findDefinition, findReferences } from "./reference.ts";
import { renameSymbol } from "./rename.ts";
import { validateDocument } from "./validation.ts";

export interface DocumentLike {
	positionAt(offset: number): lst.Position;
	offsetAt(position: lst.Position): number;

	readonly uri: string;
}

export interface CommandApplication {
	label?: string;
	edit: lst.WorkspaceEdit;
}

export interface LanguageService {
	parseDocument(doc: TextDocument | string): SourceFile;
	validateDocument(doc: DocumentLike, sourceFile: SourceFile): lst.Diagnostic[];
	hover(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.Hover | undefined;
	findReferences(
		doc: DocumentLike,
		sourceFile: SourceFile,
		position: lst.Position,
		context: lst.ReferenceContext,
	): lst.Location[];
	findDefinition(
		doc: DocumentLike,
		sourceFile: SourceFile,
		position: lst.Position,
	): lst.Location | undefined;
	renameSymbol(
		doc: DocumentLike,
		sourceFile: SourceFile,
		position: lst.Position,
		newName: string,
	): lst.WorkspaceEdit | undefined;

	getCompletions(
		doc: DocumentLike,
		sourceFile: SourceFile,
		position: lst.Position,
	): lst.CompletionItem[];

	getDocumentColors(doc: DocumentLike, sourceFile: SourceFile): ColorInformation[] | undefined;
	getColorRepresentations(
		doc: DocumentLike,
		sourceFile: SourceFile,
		color: Color,
		range: lst.Range,
	): ColorPresentation[] | undefined;

	getCodeActions(
		doc: DocumentLike,
		sourceFile: SourceFile,
		range: lst.Range,
		context: lst.CodeActionContext,
	): lst.Command[] | undefined;
	executeCommand(
		doc: DocumentLike,
		sourceFile: SourceFile,
		command: Omit<lst.Command, "title">,
	): CommandApplication | undefined;
	getAvailableCommands(): string[];

	// TODO: Prettier API
	// formatDocument(doc: Positioner, options: lsp.FormattingOptions, ct: lsp.CancellationToken): lsp.TextEdit[] | "cancelled";
}

function parseDocument(doc: TextDocument | string): SourceFile {
	const parser = new Parser();
	const content = typeof doc === "string" ? doc : doc.getText();
	const sourceFile = parser.parse(content);
	bindSourceFile(sourceFile);
	checkSourceFile(sourceFile);
	return sourceFile;
}

export function createService(): LanguageService {
	return {
		parseDocument,
		validateDocument,
		hover,
		findReferences,
		findDefinition,
		renameSymbol,
		getCompletions,
		getDocumentColors,
		getColorRepresentations,
		getCodeActions,
		executeCommand,
		getAvailableCommands,
		// formatDocument,
	};
}
