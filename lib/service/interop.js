"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lst = require("vscode-languageserver-types");
const types_1 = require("../types");
function getDiagnosticMarkerData(doc, source) {
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
exports.getDiagnosticMarkerData = getDiagnosticMarkerData;
function getMarkerDataDiagnostic(m) {
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
        severity: m.severity ? convertToLspSeverity(m.severity) : types_1.DiagnosticCategory.Suggestion,
        source: m.source,
    };
}
exports.getMarkerDataDiagnostic = getMarkerDataDiagnostic;
const lspToMonacoSeverityMap = {
    [lst.DiagnosticSeverity.Error]: 3,
    [lst.DiagnosticSeverity.Warning]: 2,
    [lst.DiagnosticSeverity.Information]: 1,
    [lst.DiagnosticSeverity.Hint]: 0,
};
const monacoToLspSeverityMap = {
    [3]: lst.DiagnosticSeverity.Error,
    [2]: lst.DiagnosticSeverity.Warning,
    [1]: lst.DiagnosticSeverity.Information,
    [0]: lst.DiagnosticSeverity.Hint,
};
function convertToMonacoSeverity(s) {
    return lspToMonacoSeverityMap[s];
}
function convertToLspSeverity(n) {
    return monacoToLspSeverityMap[n];
}
//# sourceMappingURL=interop.js.map