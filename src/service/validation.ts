import type * as lst from "vscode-languageserver-types";
import { diagnosicSource, formatError } from "../error.js";
import type { DocumentLike } from "../index.js";
import type { DiagnosticMessage, SourceFile } from "../types.js";

function convertDiagnostic(document: DocumentLike, source: DiagnosticMessage): lst.Diagnostic {
	return {
		range: {
			start: document.positionAt(source.start),
			end: document.positionAt(source.end),
		},
		severity: source.category,
		code: formatError(source.code),
		source: diagnosicSource,
		message: source.message,
	};
}

export function validateDocument(doc: DocumentLike, sourceFile: SourceFile): lst.Diagnostic[] {
	const diagnostics = sourceFile.diagnostics;
	if (!diagnostics || diagnostics.length <= 0) return [];

	return diagnostics.map(d => convertDiagnostic(doc, d));
}
