import { TextDocument } from "vscode-languageserver-textdocument";


import { ensureDocAndSourceFile, ensureGraph } from "../testutils.js";

import * as RemoveSemicolons from "../../src/service/command/RemoveSemicolons";
import { CommandIds, getCodeActions } from "../../src/service/codeAction";

describe("Remove semicolon command execution", () => {

	it("should get correct semicolon edits", () => {
		const content = `strict digraph {
			a -> b;
			a -> C
			a -> d;
			a -> e [color=red];
			a -> f [color=red]
			a -> { g h i };
			a -> { g; { g; h -> c; i }; i }
			a -> { g h i } [color=blue];
		}`;
		const expected = `strict digraph {
			a -> b
			a -> C
			a -> d
			a -> e [color=red]
			a -> f [color=red]
			a -> { g h i }
			a -> { g { g h -> c i } i }
			a -> { g h i } [color=blue]
		}`;
		const semicolons = 9;

		const [doc, sf] = ensureDocAndSourceFile(content);
		const pg = ensureGraph(sf);

		const command = {
			command: CommandIds.RemoveSemicolons,
			arguments: undefined,
		};

		const execution = RemoveSemicolons.execute(doc, sf, command);

		expect(execution).toBeDefined();
		if (!execution) throw "Just for the type checker";


		expect(execution.edit.changes).toBeDefined();
		if (!execution.edit.changes) throw "Just for the type checker";

		const edits = execution.edit.changes[doc.uri];
		expect(edits).toBeDefined();
		if (!edits) throw "Just for the type checker";

		expect(edits).toHaveLength(semicolons);

		const actual = TextDocument.applyEdits(doc, edits);

		expect(actual).toEqual(expected);
	});

	it("should offer code action", () => {
		const content = `strict digraph {
			a -> b;
			a -> C
			a -> d;
			a -> e [color=red];
			a -> f [color=red]
			a -> { g h i };
			a -> { g; { g; h -> c; i }; i }
			a -> { g h i } [color=blue];
		}`;

		const [doc, sf] = ensureDocAndSourceFile(content);
		const pg = ensureGraph(sf);

		const secondSemicolon = pg.statements[2].terminator;
		expect(secondSemicolon).toBeDefined();
		if (!secondSemicolon) throw "Just for the type checker";

		const start = secondSemicolon.end - 1;
		const end = secondSemicolon.end;

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

		expect(firstAction.command).toEqual(CommandIds.RemoveSemicolons);
		expect(firstAction.arguments).toBeUndefined();
		expect(firstAction.title).toBeDefined();
/*
		range.start = doc.positionAt(end);
		range.end = doc.positionAt(end);
		actions = getCodeActions(doc, sf, range, undefined);
		expect(actions).to.exist;
		if (!actions) throw "Just for the type checker";

		firstAction = actions[0];
		expect(firstAction).to.exist;
		if (!firstAction) throw "Just for the type checker";

		expect(firstAction.command).to.equal(CommandIds.RemoveSemicolons);
		expect(firstAction.arguments).to.be.undefined;
		expect(firstAction.title).to.exist;
*/
	});
});
