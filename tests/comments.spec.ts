import { describe, test } from "node:test";
import { expect } from "expect";

import { createParserWithText, ensureGraph } from "./testUtils.ts";
import { syntaxKind } from "../src/types.ts";

void describe("Comment Handling", () => {
	void test("should skip comments while parsing", () => {
		const p = createParserWithText(`digraph G { // funny comment
			a = b;
			/* aha! */
			c = d e = f g=3; # some other comment
		}`);
		const pg = ensureGraph(p);

		expect(pg).toMatchObject({
			strict: undefined,
			kind: syntaxKind.DirectedGraph,
			id: expect.objectContaining({ text: "G" }),
		});

		const { statements } = pg;
		expect(statements).toHaveLength(4);

		expect(statements[0]).toMatchObject({
			kind: syntaxKind.IdEqualsIdStatement,
			terminator: expect.objectContaining({
				kind: syntaxKind.SemicolonToken,
			}),
			leftId: expect.objectContaining({ text: "a" }),
			rightId: expect.objectContaining({ text: "b" }),
		});

		expect(statements[1]).toMatchObject({
			kind: syntaxKind.IdEqualsIdStatement,
			terminator: undefined,
			leftId: expect.objectContaining({ text: "c" }),
			rightId: expect.objectContaining({ text: "d" }),
		});

		expect(statements[2]).toMatchObject({
			kind: syntaxKind.IdEqualsIdStatement,
			terminator: undefined,
			leftId: expect.objectContaining({ text: "e" }),
			rightId: expect.objectContaining({ text: "f" }),
		});

		expect(statements[3]).toMatchObject({
			kind: syntaxKind.IdEqualsIdStatement,
			terminator: expect.objectContaining({
				kind: syntaxKind.SemicolonToken,
			}),
			leftId: expect.objectContaining({ text: "g" }),
			rightId: expect.objectContaining({ text: "3" }),
		});
	});
});
