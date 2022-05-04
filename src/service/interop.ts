import { DiagnosticSeverity, type Diagnostic } from "vscode-languageserver-types";
import { type DiagnosticMessage, DiagnosticCategory } from "../types";
import type { DocumentLike } from "../";

/**
 * VSCode's/Monaco's Marker data (used for diagnostics)
 */
export interface IMarkerData {
	code?: string;
	severity: number;
	message: string;
	source?: string;
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
}

export function getDiagnosticMarkerData(doc: DocumentLike, source: DiagnosticMessage): IMarkerData {
	const start = doc.positionAt(source.start);
	const end = doc.positionAt(source.end);
	return {
		message: source.message,
		severity: source.category ? convertToMonacoSeverity(source.category) : 0,
		startLineNumber: start.line,
		startColumn: start.character,
		endLineNumber: end.line,
		endColumn: end.character,
	};
}

export function getMarkerDataDiagnostic(m: IMarkerData): Diagnostic {
	return {
		message: m.message,
		range: {
			start: {
				line: m.startLineNumber,
				character: m.startColumn,
			},
			end: {
				line: m.endLineNumber,
				character: m.endColumn,
			}
		},
		code: m.code,
		severity: m.severity ? convertToLspSeverity(m.severity) : DiagnosticCategory.Suggestion,
		// Not supported
		// relatedInformation: m.source,
		source: m.source,
	};
}

const enum MonacoSeverity {
	Ignore = 0,
	Info = 1,
	Warning = 2,
	Error = 3,
}
const lspToMonacoSeverityMap = {
	[DiagnosticSeverity.Error]: MonacoSeverity.Error,
	[DiagnosticSeverity.Warning]: MonacoSeverity.Warning,
	[DiagnosticSeverity.Information]: MonacoSeverity.Info,
	[DiagnosticSeverity.Hint]: MonacoSeverity.Ignore,
};
const monacoToLspSeverityMap = {
	[MonacoSeverity.Error]: DiagnosticSeverity.Error,
	[MonacoSeverity.Warning]: DiagnosticSeverity.Warning,
	[MonacoSeverity.Info]: DiagnosticSeverity.Information,
	[MonacoSeverity.Ignore]: DiagnosticSeverity.Hint,
};
function convertToMonacoSeverity(s: DiagnosticCategory): number {
	return lspToMonacoSeverityMap[s];
}
function convertToLspSeverity(n: MonacoSeverity): DiagnosticCategory {
	return monacoToLspSeverityMap[n];
}
