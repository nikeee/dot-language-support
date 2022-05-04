import { createParserWithText, ensureGraph } from "./testutils";
import { SyntaxKind } from "../src/types";

describe("Comment Handling", () => {
	it("should skip comments while parsing", () => {
		const p = createParserWithText(`digraph G { // funny comment
			a = b;
			/* aha! */
			c = d e = f g=3; # some other comment
		}`);
		const pg = ensureGraph(p);

		expect(pg.strict).toBeFalsy();
		expect(pg.kind).toEqual(SyntaxKind.DirectedGraph);
		if (pg.kind !== SyntaxKind.DirectedGraph) throw "Just for type checker";

		// expect(pg.openBrace).to.exist;
		// expect(pg.closeBrace).to.exist;
		expect((pg.id as any).text).toEqual("G");

		const s = pg.statements;
		expect(s).toBeDefined();
		expect(s.length).toEqual(4);

		const s0 = s[0];
		expect(s0).toBeDefined();
		expect(s0.kind).toEqual(SyntaxKind.IdEqualsIdStatement);
		if (s0.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s0.terminator).toBeDefined();
		expect(s0.leftId).toBeDefined();
		expect((s0.leftId as any).text).toEqual("a");
		// expect(s0.equalsToken).to.exist;
		expect(s0.rightId).toBeDefined();
		expect((s0.rightId as any).text).toEqual("b");

		const s1 = s[1];
		expect(s1).toBeDefined();
		expect(s1.kind).toEqual(SyntaxKind.IdEqualsIdStatement);
		if (s1.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s1.terminator).toBeFalsy();
		expect(s1.leftId).toBeDefined();
		expect((s1.leftId as any).text).toEqual("c");
		// expect(s1.equalsToken).to.exist;
		expect(s1.rightId).toBeDefined();
		expect((s1.rightId as any).text).toEqual("d");

		const s2 = s[2];
		expect(s2).toBeDefined();
		expect(s2.kind).toEqual(SyntaxKind.IdEqualsIdStatement);
		if (s2.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s2.terminator).toBeFalsy();
		expect(s2.leftId).toBeDefined();
		expect((s2.leftId as any).text).toEqual("e");
		// expect(s2.equalsToken).to.exist;
		expect(s2.rightId).toBeDefined();
		expect((s2.rightId as any).text).toEqual("f");

		const s3 = s[3];
		expect(s3).toBeDefined();
		expect(s3.kind).toEqual(SyntaxKind.IdEqualsIdStatement);
		if (s3.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s3.terminator).toBeDefined();
		expect(s3.leftId).toBeDefined();
		expect((s3.leftId as any).text).toEqual("g");
		// expect(s3.equalsToken).to.exist;
		expect(s3.rightId).toBeDefined();
		expect((s3.rightId as any).text).toEqual("3");
	});
});
