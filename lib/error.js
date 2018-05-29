"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnosicSource = "DOT";
const errorCodeLength = 4;
const subErrorCodeLength = errorCodeLength - 1;
function formatError(error) {
    const subCode = (error.sub | 0)
        .toString()
        .padStart(subErrorCodeLength, "0");
    return exports.diagnosicSource + error.source + subCode;
}
exports.formatError = formatError;
//# sourceMappingURL=error.js.map