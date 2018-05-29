import * as lst from "vscode-languageserver-types";
import { Parser } from "../";
import { SourceFile, SyntaxNode, Omit } from "../types";
import { bindSourceFile } from "../binder";
import { hover } from "./hover";
import { validateDocument } from "./validation";
import { findReferences, findDefinition } from "./reference";
import { renameSymbol } from "./rename";
import { getCompletions } from "./completion";
import { checkSourceFile } from "../checker";
import { getCodeActions, executeCommand, getAvailableCommands } from "./codeAction";


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
	parseDocument(doc: lst.TextDocument | string): SourceFile;
	validateDocument(doc: DocumentLike, sourceFile: SourceFile): lst.Diagnostic[];
	hover(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.Hover | undefined;
	findReferences(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position, context: lst.ReferenceContext): lst.Location[];
	findDefinition(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.Location | undefined;
	renameSymbol(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position, newName: string): lst.WorkspaceEdit | undefined;

	getCompletions(doc: DocumentLike, sourceFile: SourceFile, position: lst.Position): lst.CompletionItem[];

	getCodeActions(doc: DocumentLike, sourceFile: SourceFile, range: lst.Range, context: lst.CodeActionContext): lst.Command[] | undefined;
	executeCommand(doc: DocumentLike, sourceFile: SourceFile, command: Omit<lst.Command, "title">): CommandApplication | undefined;
	getAvailableCommands(): string[];

	// TODO: Prettier API
	// formatDocument(doc: Positioner, options: lsp.FormattingOptions, ct: lsp.CancellationToken): lsp.TextEdit[] | "cancelled";
}

function parseDocument(doc: lst.TextDocument | string): SourceFile {
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
		getCodeActions,
		executeCommand,
		getAvailableCommands,
		// formatDocument,
	};
}
