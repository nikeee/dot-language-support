"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("../");
const binder_1 = require("../binder");
const hover_1 = require("./hover");
const validation_1 = require("./validation");
const reference_1 = require("./reference");
const rename_1 = require("./rename");
const completion_1 = require("./completion");
const checker_1 = require("../checker");
const codeAction_1 = require("./codeAction");
function parseDocument(doc) {
    const parser = new _1.Parser();
    const content = typeof doc === "string" ? doc : doc.getText();
    const sourceFile = parser.parse(content);
    binder_1.bindSourceFile(sourceFile);
    checker_1.checkSourceFile(sourceFile);
    return sourceFile;
}
function createService() {
    return {
        parseDocument,
        validateDocument: validation_1.validateDocument,
        hover: hover_1.hover,
        findReferences: reference_1.findReferences,
        findDefinition: reference_1.findDefinition,
        renameSymbol: rename_1.renameSymbol,
        getCompletions: completion_1.getCompletions,
        getCodeActions: codeAction_1.getCodeActions,
        executeCommand: codeAction_1.executeCommand,
        getAvailableCommands: codeAction_1.getAvailableCommands,
    };
}
exports.createService = createService;
//# sourceMappingURL=service.js.map