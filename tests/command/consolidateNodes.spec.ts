import { ensureDocAndSourceFile, ensureGraph } from "../testutils";
import { expect } from "chai";
import "mocha";

import * as ConsolidateDescendantsCommand from "../../src/service/command/ConsolidateDescendantsCommand";
import { TextDocument } from "vscode-languageserver-types/lib/umd/main";
import { CommandIds, getCodeActions } from "../../src/service/codeAction";
import { ExecutableCommand } from "../../src/service/command/common";

describe("Consolidate graph command execution", () => {

	it("should correclty consolidate descendents", () => {
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

		expect(actions).to.exist;
		if(!actions) throw "Just for the type checker";
		expect(actions).to.have.length(1);
		expect(actions[0]).to.exist;

		const command = actions[0];

		const execution = ConsolidateDescendantsCommand.execute(doc, sf, command as ExecutableCommand);

		expect(execution).to.exist;
		if (!execution) throw "Just for the type checker";

		expect(execution.edit.changes).to.exist;
		if (!execution.edit.changes) throw "Just for the type checker";

		const edits = execution.edit.changes[doc.uri];
		expect(edits).to.exist;
		if (!edits) throw "Just for the type checker";

		const actual = TextDocument.applyEdits(doc, edits);

		expect(actual).to.equal(expected);
	});

	it("should correclty consolidate descendents (leading assigment statement)", () => {
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

		expect(actions).to.exist;
		if(!actions) throw "Just for the type checker";
		expect(actions).to.have.length(1);
		expect(actions[0]).to.exist;

		const command = actions[0];

		const execution = ConsolidateDescendantsCommand.execute(doc, sf, command as ExecutableCommand);

		expect(execution).to.exist;
		if (!execution) throw "Just for the type checker";

		expect(execution.edit.changes).to.exist;
		if (!execution.edit.changes) throw "Just for the type checker";

		const edits = execution.edit.changes[doc.uri];
		expect(edits).to.exist;
		if (!edits) throw "Just for the type checker";

		const actual = TextDocument.applyEdits(doc, edits);

		expect(actual).to.equal(expected);
	});

	it("should offer code action", () => {
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
		expect(actions).to.exist;
		if (!actions) throw "Just for the type checker";

		let firstAction = actions[0];
		expect(firstAction).to.exist;
		if (!firstAction) throw "Just for the type checker";

		expect(firstAction.command).to.equal(CommandIds.ConsolidateDescendants);
		expect(firstAction.arguments).not.to.be.undefined;
		expect(firstAction.arguments).to.have.length(2)
		expect(firstAction.title).to.exist;
	});

	it("should offer code action (leading assigment statement)", () => {
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
		expect(actions).to.exist;
		if (!actions) throw "Just for the type checker";

		let firstAction = actions[0];
		expect(firstAction).to.exist;
		if (!firstAction) throw "Just for the type checker";

		expect(firstAction.command).to.equal(CommandIds.ConsolidateDescendants);
		expect(firstAction.arguments).not.to.be.undefined;
		expect(firstAction.arguments).to.have.length(2)
		expect(firstAction.title).to.exist;
	});
});
