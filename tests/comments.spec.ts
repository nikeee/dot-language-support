import { createParserWithText, ensureGraph } from "./testutils";
import { SyntaxKind } from "../src/types";
import { expect } from "chai";
import "mocha";

describe("Comment Handling", () => {
	it("should skip comments while parsing", () => {
		const p = createParserWithText(`digraph G { // funny comment
			a = b;
			/* aha! */
			c = d e = f g=3; # some other comment
		}`);
		const pg = ensureGraph(p);

		expect(pg.strict).to.not.exist;
		expect(pg.kind).to.equal(SyntaxKind.DirectedGraph);
		if (pg.kind !== SyntaxKind.DirectedGraph) throw "Just for type checker";

		// expect(pg.openBrace).to.exist;
		// expect(pg.closeBrace).to.exist;
		expect((pg.id as any).text).to.equal("G");

		const s = pg.statements;
		expect(s).to.exist;
		expect(s.length).to.equal(4);

		const s0 = s[0];
		expect(s0).to.exist;
		expect(s0.kind).to.equal(SyntaxKind.IdEqualsIdStatement);
		if (s0.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s0.terminator).to.exist;
		expect(s0.leftId).to.exist;
		expect((s0.leftId as any).text).to.equal("a");
		// expect(s0.equalsToken).to.exist;
		expect(s0.rightId).to.exist;
		expect((s0.rightId as any).text).to.equal("b");

		const s1 = s[1];
		expect(s1).to.exist;
		expect(s1.kind).to.equal(SyntaxKind.IdEqualsIdStatement);
		if (s1.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s1.terminator).not.to.exist;
		expect(s1.leftId).to.exist;
		expect((s1.leftId as any).text).to.equal("c");
		// expect(s1.equalsToken).to.exist;
		expect(s1.rightId).to.exist;
		expect((s1.rightId as any).text).to.equal("d");

		const s2 = s[2];
		expect(s2).to.exist;
		expect(s2.kind).to.equal(SyntaxKind.IdEqualsIdStatement);
		if (s2.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s2.terminator).not.to.exist;
		expect(s2.leftId).to.exist;
		expect((s2.leftId as any).text).to.equal("e");
		// expect(s2.equalsToken).to.exist;
		expect(s2.rightId).to.exist;
		expect((s2.rightId as any).text).to.equal("f");

		const s3 = s[3];
		expect(s3).to.exist;
		expect(s3.kind).to.equal(SyntaxKind.IdEqualsIdStatement);
		if (s3.kind !== SyntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s3.terminator).to.exist;
		expect(s3.leftId).to.exist;
		expect((s3.leftId as any).text).to.equal("g");
		// expect(s3.equalsToken).to.exist;
		expect(s3.rightId).to.exist;
		expect((s3.rightId as any).text).to.equal("3");
	});
});
