import * as lst from "vscode-languageserver-types";
import { DiagnosticMessage, DiagnosticCategory } from "../types";
import { DocumentLike } from "../";

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

export function getMarkerDataDiagnostic(m: IMarkerData): lst.Diagnostic {
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
	[lst.DiagnosticSeverity.Error]: MonacoSeverity.Error,
	[lst.DiagnosticSeverity.Warning]: MonacoSeverity.Warning,
	[lst.DiagnosticSeverity.Information]: MonacoSeverity.Info,
	[lst.DiagnosticSeverity.Hint]: MonacoSeverity.Ignore,
};
const monacoToLspSeverityMap = {
	[MonacoSeverity.Error]: lst.DiagnosticSeverity.Error,
	[MonacoSeverity.Warning]: lst.DiagnosticSeverity.Warning,
	[MonacoSeverity.Info]: lst.DiagnosticSeverity.Information,
	[MonacoSeverity.Ignore]: lst.DiagnosticSeverity.Hint,
};
function convertToMonacoSeverity(s: DiagnosticCategory): number {
	return lspToMonacoSeverityMap[s];
}
function convertToLspSeverity(n: MonacoSeverity): DiagnosticCategory {
	return monacoToLspSeverityMap[n];
}
