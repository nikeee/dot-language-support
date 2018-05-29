"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("../error");
function convertDiagnostic(document, source) {
    return {
        range: {
            start: document.positionAt(source.start),
            end: document.positionAt(source.end),
        },
        severity: source.category,
        code: error_1.formatError(source.code),
        source: error_1.diagnosicSource,
        message: source.message,
    };
}
function validateDocument(doc, sourceFile) {
    const diagnostics = sourceFile.diagnostics;
    if (!diagnostics || diagnostics.length <= 0)
        return [];
    return diagnostics.map(d => convertDiagnostic(doc, d));
}
exports.validateDocument = validateDocument;
//# sourceMappingURL=validation.js.map