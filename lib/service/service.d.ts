import * as lst from "vscode-languageserver-types";
import { SourceFile, Omit } from "../types";
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
}
export declare function createService(): LanguageService;
