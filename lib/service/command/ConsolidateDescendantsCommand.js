"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const checker_1 = require("../../checker");
const util_1 = require("../util");
function create(statements, below) {
    const first = statements[0];
    const from = checker_1.getIdentifierText(first.source.id);
    const title = below
        ? `Convert edges below from "${from}" to subgraph`
        : `Convert edges from "${from}" to subgraph`;
    return {
        title,
        command: "DOT.consolidateDescendants",
        arguments: statements.map(s => s.pos),
    };
}
exports.create = create;
function unbind(statements) {
    const res = [];
    for (const statement of statements) {
        const { parent } = statement, copy = __rest(statement, ["parent"]);
    }
    return res;
}
function execute(doc, sourceFile, cmd) {
    if (!isConsolidateDescendantsCommand(cmd))
        return undefined;
    const g = sourceFile.graph;
    if (!g)
        return undefined;
    const candidateIndexes = cmd.arguments;
    const candidates = candidateIndexes.map(i => checker_1.findNodeAtOffset(g, i).parent.parent);
    const first = candidates.shift();
    const from = checker_1.getIdentifierText(first.source.id);
    const edits = [];
    const firstRight = first.rhs[0];
    const firstRightTargetStart = util_1.getStart(sourceFile, firstRight.target);
    const firstRightTargetEnd = firstRight.target.end;
    const contents = [
        sourceFile.content.substring(firstRightTargetStart, firstRightTargetEnd)
    ];
    for (const descendant of candidates) {
        const rightItem = descendant.rhs[0];
        const rightItemTarget = rightItem.target;
        const rightItemTargetStart = rightItemTarget.pos;
        const rightItemTargetEnd = rightItem.target.end;
        const rightItemContent = sourceFile.content.substring(rightItemTargetStart, rightItemTargetEnd);
        edits.push({
            newText: "",
            range: {
                start: doc.positionAt(descendant.pos),
                end: doc.positionAt(rightItemTargetStart),
            }
        });
        edits.push({
            newText: "",
            range: {
                start: doc.positionAt(rightItemTargetStart),
                end: doc.positionAt(rightItemTargetEnd),
            }
        });
        if (descendant.terminator !== undefined) {
            edits.push({
                newText: "",
                range: {
                    start: doc.positionAt(util_1.getStart(sourceFile, descendant.terminator)),
                    end: doc.positionAt(descendant.terminator.end),
                }
            });
        }
        contents.push(rightItemContent);
    }
    const toInsert = `{ ${contents.map(s => s.trim()).join(" ")} }`;
    edits.push({
        newText: toInsert,
        range: {
            start: doc.positionAt(firstRightTargetStart),
            end: doc.positionAt(firstRightTargetEnd),
        }
    });
    return {
        label: `Convert edges from "${from}" to subgraph.`,
        edit: {
            changes: {
                [doc.uri]: edits,
            }
        }
    };
}
exports.execute = execute;
function isConsolidateDescendantsCommand(cmd) {
    return cmd.command === "DOT.consolidateDescendants" && !!cmd.arguments && cmd.arguments.length > 1;
}
//# sourceMappingURL=ConsolidateDescendantsCommand.js.map