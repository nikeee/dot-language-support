import type * as lst from "vscode-languageserver-types";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { ColorInformation, Color, ColorPresentation } from "./polyfill"; // TODO: Remove this import and use lst later
import { Parser } from "../";
import { SourceFile, Omit } from "../types";
import { bindSourceFile } from "../binder";
import { hover } from "./hover";
import { validateDocument } from "./validation";
import { findReferences, findDefinition } from "./reference";
import { renameSymbol } from "./rename";
import { getCompletions } from "./completion";
import { checkSourceFile } from "../checker";
import { getCodeActions, executeCommand, getAvailableCommands } from "./codeAction";
import { getDocumentColors, getColorRepresentations } from "./colorProvider";

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
	findReferences(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position, context: lst.ReferenceContext): lst.Location[];
	findDefinition(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.Location | undefined;
	renameSymbol(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position, newName: string): lst.WorkspaceEdit | undefined;

	getCompletions(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.CompletionItem[];

	getDocumentColors(doc: DocumentLike, sourceFile: SourceFile): ColorInformation[] | undefined;
	getColorRepresentations(doc: DocumentLike, sourceFile: SourceFile, color: Color, range: lst.Range): ColorPresentation[] | undefined;

	getCodeActions(doc: DocumentLike, sourceFile: SourceFile, range: lst.Range, context: lst.CodeActionContext): lst.Command[] | undefined;
	executeCommand(doc: DocumentLike, sourceFile: SourceFile, command: Omit<lst.Command, "title">): CommandApplication | undefined;
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
