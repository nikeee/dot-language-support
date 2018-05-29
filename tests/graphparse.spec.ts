import { createParserWithText, ensureGraph } from "./testutils";
import { SyntaxKind } from "../src/types";
import { Parser } from "../src/parser";
import { expect } from "chai";
import "mocha";

describe("Graph Parsing", () => {

	it("should parse a simple graph", () => {
		const p = createParserWithText(`strict digraph lol {}`);
		const pg = ensureGraph(p);

		expect(pg.kind).to.equal(SyntaxKind.DirectedGraph);
		expect(pg.id).to.exist;
		if(pg.id === undefined) throw "Just for type checker";
		expect(pg.id.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((pg.id as any).text).to.equal("lol");
		expect(pg.strict).to.exist;
		expect(pg.statements).to.exist;
		expect(pg.statements.length).to.equal(0);

		// expect(pg.openBrace).to.exist;
		// expect(pg.closeBrace).to.exist;
	});

	it("should parse attributes", () => {
		const p = createParserWithText(
			`strict digraph lol { graph [ size = lel, other=lal; pi= 3]
		node [fontsize = 36,shape = polygon,][]
		[e=2] }
		`);
		const pg = ensureGraph(p);

		expect(pg.kind).to.equal(SyntaxKind.DirectedGraph);
		expect(pg.id).to.exist;
		if(pg.id === undefined) throw "Just for type checker";
		expect(pg.id.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((pg.id as any).text).to.equal("lol");
		expect(pg.strict).to.exist;
		expect(pg.statements).to.exist;
		expect(pg.statements.length).to.equal(2);

		// expect(pg.openBrace).to.exist;
		// expect(pg.closeBrace).to.exist;

		const sts = pg.statements;

		const gS = sts[0];
		expect(gS).to.exist;
		expect(gS.kind).to.equal(SyntaxKind.AttributeStatement);
		if (gS.kind !== SyntaxKind.AttributeStatement) throw "Just for type checker";

		expect(gS.subject.kind).to.equal(SyntaxKind.GraphKeyword);

		expect(gS.attributes).to.exist;
		expect(gS.attributes.length).to.equal(1);
		if (gS.attributes === undefined || gS.attributes.length !== 1) throw "Just for type checker";

		const gsa = gS.attributes;
		expect(gsa[0]).to.exist;
		expect(gsa[0].kind).to.equal(SyntaxKind.AttributeContainer);

		const gsaa = gsa[0].assignments;
		expect(gsaa).to.exist;
		expect(gsaa.length).to.equal(3);

		expect(gsaa[0].kind).to.equal(SyntaxKind.Assignment);
		expect(gsaa[0].leftId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((gsaa[0].leftId as any).text).to.equal("size");
		// expect(gsaa[0].equalsToken).to.exist;
		expect(gsaa[0].rightId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((gsaa[0].rightId as any).text).to.equal("lel");

		expect(gsaa[1].kind).to.equal(SyntaxKind.Assignment);
		expect(gsaa[1].leftId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((gsaa[1].leftId as any).text).to.equal("other");
		// expect(gsaa[1].equalsToken).to.exist;
		expect(gsaa[1].rightId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((gsaa[1].rightId as any).text).to.equal("lal");

		expect(gsaa[2].kind).to.equal(SyntaxKind.Assignment);
		expect(gsaa[2].leftId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((gsaa[2].leftId as any).text).to.equal("pi");
		// expect(gsaa[2].equalsToken).to.exist;
		expect(gsaa[2].rightId.kind).to.equal(SyntaxKind.NumericIdentifier);
		expect((gsaa[2].rightId as any).text).to.equal("3");

		const nS = sts[1];
		expect(nS).to.exist;
		expect(nS.kind).to.equal(SyntaxKind.AttributeStatement);
		if (nS.kind !== SyntaxKind.AttributeStatement) throw "Just for type checker";

		expect(nS.subject.kind).to.equal(SyntaxKind.NodeKeyword);

		expect(nS.attributes).to.exist;
		expect(nS.attributes.length).to.equal(3);
		if (nS.attributes === undefined || nS.attributes.length !== 3) throw "Just for type checker";

		const nsa = nS.attributes;
		expect(nsa[0]).to.exist;
		expect(nsa[0].kind).to.equal(SyntaxKind.AttributeContainer);

		const nsaa = nsa[0].assignments;
		expect(nsaa).to.exist;
		expect(nsaa.length).to.equal(2);

		expect(nsaa[0].kind).to.equal(SyntaxKind.Assignment);
		expect(nsaa[0].leftId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((nsaa[0].leftId as any).text).to.equal("fontsize");
		// expect(nsaa[0].equalsToken).to.exist;
		expect(nsaa[0].rightId.kind).to.equal(SyntaxKind.NumericIdentifier);
		expect((nsaa[0].rightId as any).text).to.equal("36");

		expect(nsaa[1].kind).to.equal(SyntaxKind.Assignment);
		expect(nsaa[1].leftId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((nsaa[1].leftId as any).text).to.equal("shape");
		// expect(nsaa[1].equalsToken).to.exist;
		expect(nsaa[1].rightId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((nsaa[1].rightId as any).text).to.equal("polygon");

		const nsaa1 = nsa[1].assignments;
		expect(nsaa1).to.exist;
		expect(nsaa1.length).to.equal(0);

		const nsaa2 = nsa[2].assignments;
		expect(nsaa2).to.exist;
		expect(nsaa2.length).to.equal(1);

		expect(nsaa2[0].kind).to.equal(SyntaxKind.Assignment);
		expect(nsaa2[0].leftId.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((nsaa2[0].leftId as any).text).to.equal("e");
		// expect(nsaa2[0].equalsToken).to.exist;
		expect(nsaa2[0].rightId.kind).to.equal(SyntaxKind.NumericIdentifier);
		expect((nsaa2[0].rightId as any).text).to.equal("2");

	});

	it("should parse sub graphs", () => {

		const p = createParserWithText(`digraph G {
			subgraph cluster_0 { }
			subgraph cluster_1 { }
			{ }
			subgraph { graph [le=la] }
			{ graph [le=la]; node[] };
		}`);
		const pg = ensureGraph(p);

		expect(pg.kind).to.equal(SyntaxKind.DirectedGraph);
		expect(pg.id).to.exist;
		if(pg.id === undefined) throw "Just for type checker";
		expect(pg.id.kind).to.equal(SyntaxKind.TextIdentifier);
		expect((pg.id as any).text).to.equal("G");

		expect(pg.strict).to.be.undefined;

		const ss = pg.statements;
		expect(ss).to.exist;
		expect(ss.length).to.equal(5);

		const s0 = ss[0];
		expect(s0).to.exist;
		expect(s0.kind).to.equal(SyntaxKind.SubGraphStatement);
		if (s0.kind !== SyntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s0.terminator).to.not.exist;
		expect(s0.subgraph.id).to.exist;
		expect((s0.subgraph.id as any).text).to.equal("cluster_0");
		expect(s0.subgraph.statements).to.exist;
		expect(s0.subgraph.statements.length).to.equal(0);

		const s1 = ss[1];
		expect(s1).to.exist;
		expect(s1.kind).to.equal(SyntaxKind.SubGraphStatement);
		if (s1.kind !== SyntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s1.terminator).to.not.exist;
		expect(s1.subgraph.id).to.exist;
		expect((s1.subgraph.id as any).text).to.equal("cluster_1");
		expect(s1.subgraph.statements).to.exist;
		expect(s1.subgraph.statements.length).to.equal(0);

		const s2 = ss[2];
		expect(s2).to.exist;
		expect(s2.kind).to.equal(SyntaxKind.SubGraphStatement);
		if (s2.kind !== SyntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s2.terminator).to.not.exist;
		expect(s2.subgraph.id).to.be.undefined;
		expect(s2.subgraph.statements).to.exist;
		expect(s2.subgraph.statements.length).to.equal(0);

		const s3 = ss[3];
		expect(s3).to.exist;
		expect(s3.kind).to.equal(SyntaxKind.SubGraphStatement);
		if (s3.kind !== SyntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s3.terminator).to.not.exist;
		expect(s3.subgraph.id).to.be.undefined;
		expect(s3.subgraph.statements).to.exist;
		expect(s3.subgraph.statements.length).to.equal(1);

		const s4 = ss[4];
		expect(s4).to.exist;
		expect(s4.kind).to.equal(SyntaxKind.SubGraphStatement);
		if (s4.kind !== SyntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s4.terminator).to.exist;
		expect(s4.subgraph.id).to.be.undefined;
		expect(s4.subgraph.statements).to.exist;
		expect(s4.subgraph.statements.length).to.equal(2);

		const s4s = s4.subgraph.statements;
		expect(s4s[0]).to.exist;
		expect(s4s[1]).to.exist;
		expect(s4s[0].terminator).to.exist;
		expect(s4s[1].terminator).to.not.exist;
	});

	it("should parse direct identifier assignments", () => {
		const p = createParserWithText(`digraph G { a = b; c = d e = f g=3;}`);
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
