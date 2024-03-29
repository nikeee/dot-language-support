import { describe, test, expect } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";

import { ensureDocAndSourceFile, ensureGraph } from "../testutils.js";
import * as ConsolidateDescendantsCommand from "../../src/service/command/ConsolidateDescendantsCommand.js";
import { CommandIds, getCodeActions } from "../../src/service/codeAction.js";
import { ExecutableCommand } from "../../src/service/command/common.js";

describe("Consolidate graph command execution", () => {

	test("should correclty consolidate descendents", () => {
		const content = `graph{a -- b;a -- c;}`;
		const expected = `graph{a -- { b c };}`;

		const [doc, sf] = ensureDocAndSourceFile(content);
		const pg = ensureGraph(sf);

		const start = pg.statements[0].pos;
		const end = pg.statements[0].pos;

		const range = {
			start: doc.positionAt(start),
			end: doc.positionAt(end),
		};

		const actions = getCodeActions(doc, sf, range, undefined);

		expect(actions).toBeDefined();
		if(!actions) throw "Just for the type checker";
		expect(actions).toHaveLength(1);
		expect(actions[0]).toBeDefined();

		const command = actions[0];

		const execution = ConsolidateDescendantsCommand.execute(doc, sf, command as ExecutableCommand);

		expect(execution).toBeDefined();
		if (!execution) throw "Just for the type checker";

		expect(execution.edit.changes).toBeDefined();
		if (!execution.edit.changes) throw "Just for the type checker";

		const edits = execution.edit.changes[doc.uri];
		expect(edits).toBeDefined();
		if (!edits) throw "Just for the type checker";

		const actual = TextDocument.applyEdits(doc, edits);

		expect(actual).toEqual(expected);
	});

	test(
        "should correclty consolidate descendents (leading assigment statement)",
        () => {
            const content = `graph{node[shape=box];a -- b;a -- c;}`;
            const expected = `graph{node[shape=box];a -- { b c };}`;

            const [doc, sf] = ensureDocAndSourceFile(content);
            const pg = ensureGraph(sf);

            const start = pg.statements[1].pos;
            const end = pg.statements[1].pos;

            const range = {
                start: doc.positionAt(start),
                end: doc.positionAt(end),
            };

            const actions = getCodeActions(doc, sf, range, undefined);

            expect(actions).toBeDefined();
            if(!actions) throw "Just for the type checker";
            expect(actions).toHaveLength(1);
            expect(actions[0]).toBeDefined();

            const command = actions[0];

            const execution = ConsolidateDescendantsCommand.execute(doc, sf, command as ExecutableCommand);

            expect(execution).toBeDefined();
            if (!execution) throw "Just for the type checker";

            expect(execution.edit.changes).toBeDefined();
            if (!execution.edit.changes) throw "Just for the type checker";

            const edits = execution.edit.changes[doc.uri];
            expect(edits).toBeDefined();
            if (!edits) throw "Just for the type checker";

            const actual = TextDocument.applyEdits(doc, edits);

            expect(actual).toEqual(expected);
        }
    );

	test("should offer code action", () => {
		const content = `graph{a -- b;a -- c;}`;

		const [doc, sf] = ensureDocAndSourceFile(content);
		const pg = ensureGraph(sf);

		const start = pg.statements[0].pos;
		const end = pg.statements[0].pos;

		const range = {
			start: doc.positionAt(start),
			end: doc.positionAt(end),
		};

		let actions = getCodeActions(doc, sf, range, undefined);
		expect(actions).toBeDefined();
		if (!actions) throw "Just for the type checker";

		let firstAction = actions[0];
		expect(firstAction).toBeDefined();
		if (!firstAction) throw "Just for the type checker";

		expect(firstAction.command).toEqual(CommandIds.ConsolidateDescendants);
		expect(firstAction.arguments).toBeDefined();
		expect(firstAction.arguments).toHaveLength(2)
		expect(firstAction.title).toBeDefined();
	});

	test("should offer code action (leading assigment statement)", () => {
		const content = `graph{node[shape=box];a -- b;a -- c;}`;

		const [doc, sf] = ensureDocAndSourceFile(content);
		const pg = ensureGraph(sf);

		const start = pg.statements[1].pos;
		const end = pg.statements[1].pos;

		const range = {
			start: doc.positionAt(start),
			end: doc.positionAt(start),
		};

		let actions = getCodeActions(doc, sf, range, undefined);
		expect(actions).toBeDefined();
		if (!actions) throw "Just for the type checker";

		let firstAction = actions[0];
		expect(firstAction).toBeDefined();
		if (!firstAction) throw "Just for the type checker";

		expect(firstAction.command).toEqual(CommandIds.ConsolidateDescendants);
		expect(firstAction.arguments).toBeDefined();
		expect(firstAction.arguments).toHaveLength(2)
		expect(firstAction.title).toBeDefined();
	});
});
