import { describe, test } from "node:test";
import { expect } from "expect";

import { createParserWithText, ensureGraph } from "./testUtils.ts";
import { syntaxKind, type EdgeStatement, type NodeId } from "../src/types.ts";

describe("Graph Parsing", () => {

	test("should parse a simple graph", () => {
		const p = createParserWithText(`strict digraph lol {}`);
		const pg = ensureGraph(p);

		expect(pg.kind).toEqual(syntaxKind.DirectedGraph);
		expect(pg.id).toBeDefined();
		if (pg.id === undefined) throw "Just for type checker";
		expect(pg.id.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg.id as any).text).toEqual("lol");
		expect(pg.strict).toBeDefined();
		expect(pg.statements).toBeDefined();
		expect(pg.statements.length).toEqual(0);

		// expect(pg.openBrace).to.exist;
		// expect(pg.closeBrace).to.exist;
	});

	test("should parse numbers as IDs", () => {
		const p = createParserWithText(`digraph { 1 -> 2}`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);

		expect(pg.kind).toEqual(syntaxKind.DirectedGraph);
		expect(pg.id).toBeFalsy();

		expect(pg.statements).toBeDefined();
		expect(pg.statements.length).toEqual(1);

		const fs = pg.statements[0];

		expect(fs).toBeDefined();
		expect(fs.kind).toEqual(syntaxKind.EdgeStatement);
		const es = fs as EdgeStatement;
		expect(es).toBeDefined();
		expect(es.source).toBeDefined();
		expect(es.source.kind).toEqual(syntaxKind.NodeId);
		const ess = es.source as NodeId;
		expect(ess).toBeDefined();
		if (ess === undefined) throw "Just for type checker";
		expect(ess.id.kind).toEqual(syntaxKind.NumericIdentifier);
	});

	test("should parse attributes", () => {
		const p = createParserWithText(
			`strict digraph lol { graph [ size = lel, other=lal; pi= 3]
		node [fontsize = 36,shape = polygon,][]
		[e=2] }
		`);
		const pg = ensureGraph(p);

		expect(pg.kind).toEqual(syntaxKind.DirectedGraph);
		expect(pg.id).toBeDefined();
		if (pg.id === undefined) throw "Just for type checker";
		expect(pg.id.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg.id as any).text).toEqual("lol");
		expect(pg.strict).toBeDefined();
		expect(pg.statements).toBeDefined();
		expect(pg.statements.length).toEqual(2);

		// expect(pg.openBrace).to.exist;
		// expect(pg.closeBrace).to.exist;

		const sts = pg.statements;

		const gS = sts[0];
		expect(gS).toBeDefined();
		expect(gS.kind).toEqual(syntaxKind.AttributeStatement);
		if (gS.kind !== syntaxKind.AttributeStatement) throw "Just for type checker";

		expect(gS.subject.kind).toEqual(syntaxKind.GraphKeyword);

		expect(gS.attributes).toBeDefined();
		expect(gS.attributes.length).toEqual(1);
		if (gS.attributes === undefined || gS.attributes.length !== 1) throw "Just for type checker";

		const gsa = gS.attributes;
		expect(gsa[0]).toBeDefined();
		expect(gsa[0].kind).toEqual(syntaxKind.AttributeContainer);

		const gsaa = gsa[0].assignments;
		expect(gsaa).toBeDefined();
		expect(gsaa.length).toEqual(3);

		expect(gsaa[0].kind).toEqual(syntaxKind.Assignment);
		expect(gsaa[0].leftId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((gsaa[0].leftId as any).text).toEqual("size");
		// expect(gsaa[0].equalsToken).to.exist;
		expect(gsaa[0].rightId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((gsaa[0].rightId as any).text).toEqual("lel");

		expect(gsaa[1].kind).toEqual(syntaxKind.Assignment);
		expect(gsaa[1].leftId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((gsaa[1].leftId as any).text).toEqual("other");
		// expect(gsaa[1].equalsToken).to.exist;
		expect(gsaa[1].rightId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((gsaa[1].rightId as any).text).toEqual("lal");

		expect(gsaa[2].kind).toEqual(syntaxKind.Assignment);
		expect(gsaa[2].leftId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((gsaa[2].leftId as any).text).toEqual("pi");
		// expect(gsaa[2].equalsToken).to.exist;
		expect(gsaa[2].rightId.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((gsaa[2].rightId as any).text).toEqual("3");

		const nS = sts[1];
		expect(nS).toBeDefined();
		expect(nS.kind).toEqual(syntaxKind.AttributeStatement);
		if (nS.kind !== syntaxKind.AttributeStatement) throw "Just for type checker";

		expect(nS.subject.kind).toEqual(syntaxKind.NodeKeyword);

		expect(nS.attributes).toBeDefined();
		expect(nS.attributes.length).toEqual(3);
		if (nS.attributes === undefined || nS.attributes.length !== 3) throw "Just for type checker";

		const nsa = nS.attributes;
		expect(nsa[0]).toBeDefined();
		expect(nsa[0].kind).toEqual(syntaxKind.AttributeContainer);

		const nsaa = nsa[0].assignments;
		expect(nsaa).toBeDefined();
		expect(nsaa.length).toEqual(2);

		expect(nsaa[0].kind).toEqual(syntaxKind.Assignment);
		expect(nsaa[0].leftId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((nsaa[0].leftId as any).text).toEqual("fontsize");
		// expect(nsaa[0].equalsToken).to.exist;
		expect(nsaa[0].rightId.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((nsaa[0].rightId as any).text).toEqual("36");

		expect(nsaa[1].kind).toEqual(syntaxKind.Assignment);
		expect(nsaa[1].leftId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((nsaa[1].leftId as any).text).toEqual("shape");
		// expect(nsaa[1].equalsToken).to.exist;
		expect(nsaa[1].rightId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((nsaa[1].rightId as any).text).toEqual("polygon");

		const nsaa1 = nsa[1].assignments;
		expect(nsaa1).toBeDefined();
		expect(nsaa1.length).toEqual(0);

		const nsaa2 = nsa[2].assignments;
		expect(nsaa2).toBeDefined();
		expect(nsaa2.length).toEqual(1);

		expect(nsaa2[0].kind).toEqual(syntaxKind.Assignment);
		expect(nsaa2[0].leftId.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((nsaa2[0].leftId as any).text).toEqual("e");
		// expect(nsaa2[0].equalsToken).to.exist;
		expect(nsaa2[0].rightId.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((nsaa2[0].rightId as any).text).toEqual("2");

	});

	test("should parse sub graphs", () => {

		const p = createParserWithText(`digraph G {
			subgraph cluster_0 { }
			subgraph cluster_1 { }
			{ }
			subgraph { graph [le=la] }
			{ graph [le=la]; node[] };
		}`);
		const pg = ensureGraph(p);

		expect(pg.kind).toEqual(syntaxKind.DirectedGraph);
		expect(pg.id).toBeDefined();
		if (pg.id === undefined) throw "Just for type checker";
		expect(pg.id.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg.id as any).text).toEqual("G");

		expect(pg.strict).toBeUndefined();

		const ss = pg.statements;
		expect(ss).toBeDefined();
		expect(ss.length).toEqual(5);

		const s0 = ss[0];
		expect(s0).toBeDefined();
		expect(s0.kind).toEqual(syntaxKind.SubGraphStatement);
		if (s0.kind !== syntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s0.terminator).toBeFalsy();
		expect(s0.subgraph.id).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s0.subgraph.id as any).text).toEqual("cluster_0");
		expect(s0.subgraph.statements).toBeDefined();
		expect(s0.subgraph.statements.length).toEqual(0);

		const s1 = ss[1];
		expect(s1).toBeDefined();
		expect(s1.kind).toEqual(syntaxKind.SubGraphStatement);
		if (s1.kind !== syntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s1.terminator).toBeFalsy();
		expect(s1.subgraph.id).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s1.subgraph.id as any).text).toEqual("cluster_1");
		expect(s1.subgraph.statements).toBeDefined();
		expect(s1.subgraph.statements.length).toEqual(0);

		const s2 = ss[2];
		expect(s2).toBeDefined();
		expect(s2.kind).toEqual(syntaxKind.SubGraphStatement);
		if (s2.kind !== syntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s2.terminator).toBeFalsy();
		expect(s2.subgraph.id).toBeUndefined();
		expect(s2.subgraph.statements).toBeDefined();
		expect(s2.subgraph.statements.length).toEqual(0);

		const s3 = ss[3];
		expect(s3).toBeDefined();
		expect(s3.kind).toEqual(syntaxKind.SubGraphStatement);
		if (s3.kind !== syntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s3.terminator).toBeFalsy();
		expect(s3.subgraph.id).toBeUndefined();
		expect(s3.subgraph.statements).toBeDefined();
		expect(s3.subgraph.statements.length).toEqual(1);

		const s4 = ss[4];
		expect(s4).toBeDefined();
		expect(s4.kind).toEqual(syntaxKind.SubGraphStatement);
		if (s4.kind !== syntaxKind.SubGraphStatement) throw "Just for type checker";
		expect(s4.terminator).toBeDefined();
		expect(s4.subgraph.id).toBeUndefined();
		expect(s4.subgraph.statements).toBeDefined();
		expect(s4.subgraph.statements.length).toEqual(2);

		const s4s = s4.subgraph.statements;
		expect(s4s[0]).toBeDefined();
		expect(s4s[1]).toBeDefined();
		expect(s4s[0].terminator).toBeDefined();
		expect(s4s[1].terminator).toBeFalsy();
	});

	test("should parse direct identifier assignments", () => {
		const p = createParserWithText(`digraph G { a = b; c = d e = f g=3;}`);
		const pg = ensureGraph(p);

		expect(pg.strict).toBeFalsy();
		expect(pg.kind).toEqual(syntaxKind.DirectedGraph);
		if (pg.kind !== syntaxKind.DirectedGraph) throw "Just for type checker";

		// expect(pg.openBrace).to.exist;
		// expect(pg.closeBrace).to.exist;
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg.id as any).text).toEqual("G");

		const s = pg.statements;
		expect(s).toBeDefined();
		expect(s.length).toEqual(4);

		const s0 = s[0];
		expect(s0).toBeDefined();
		expect(s0.kind).toEqual(syntaxKind.IdEqualsIdStatement);
		if (s0.kind !== syntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s0.terminator).toBeDefined();
		expect(s0.leftId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s0.leftId as any).text).toEqual("a");
		// expect(s0.equalsToken).to.exist;
		expect(s0.rightId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s0.rightId as any).text).toEqual("b");

		const s1 = s[1];
		expect(s1).toBeDefined();
		expect(s1.kind).toEqual(syntaxKind.IdEqualsIdStatement);
		if (s1.kind !== syntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s1.terminator).toBeFalsy();
		expect(s1.leftId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s1.leftId as any).text).toEqual("c");
		// expect(s1.equalsToken).to.exist;
		expect(s1.rightId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s1.rightId as any).text).toEqual("d");

		const s2 = s[2];
		expect(s2).toBeDefined();
		expect(s2.kind).toEqual(syntaxKind.IdEqualsIdStatement);
		if (s2.kind !== syntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s2.terminator).toBeFalsy();
		expect(s2.leftId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s2.leftId as any).text).toEqual("e");
		// expect(s2.equalsToken).to.exist;
		expect(s2.rightId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s2.rightId as any).text).toEqual("f");

		const s3 = s[3];
		expect(s3).toBeDefined();
		expect(s3.kind).toEqual(syntaxKind.IdEqualsIdStatement);
		if (s3.kind !== syntaxKind.IdEqualsIdStatement) throw "Just for type checker";
		expect(s3.terminator).toBeDefined();
		expect(s3.leftId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s3.leftId as any).text).toEqual("g");
		// expect(s3.equalsToken).to.exist;
		expect(s3.rightId).toBeDefined();
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((s3.rightId as any).text).toEqual("3");
	});

	test("should parse graph with Mdiamond and Msquare shapes", () => {
		const p = createParserWithText(`digraph G {
			start -> end;
			start [shape=Mdiamond];
			end [shape=Msquare];
		}`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.kind).toEqual(syntaxKind.DirectedGraph);
		expect(pg.id).toBeDefined();
		if (pg.id === undefined) throw "Just for type checker";
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg.id as any).text).toEqual("G");
		expect(pg.statements).toBeDefined();
		expect(pg.statements.length).toEqual(3);
	});
});
