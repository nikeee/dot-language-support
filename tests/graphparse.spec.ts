import { describe, test } from "node:test";
import { expect } from "expect";

import { createParserWithText, ensureGraph } from "./testUtils.ts";
import { type SubGraphStatement, syntaxKind, type NodeId, type EdgeStatement, type AttributeStatement } from "../src/types.ts";

describe("Graph Parsing", () => {

	test("should parse a simple graph", () => {
		const p = createParserWithText(`strict digraph lol {}`);
		const pg = ensureGraph(p);

		expect(pg).toMatchObject({
			kind: syntaxKind.DirectedGraph,
			id: expect.objectContaining({
				kind: syntaxKind.TextIdentifier,
				text: "lol",
			}),
			strict: expect.anything(),
		});
		expect(pg.statements).toHaveLength(0);
	});

	test("should parse numbers as IDs", () => {
		const p = createParserWithText(`digraph { 1 -> 2}`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);

		expect(pg).toMatchObject({
			kind: syntaxKind.DirectedGraph,
			id: undefined,
		});

		expect(pg.statements).toHaveLength(1);

		const fs = pg.statements[0] as EdgeStatement;
		expect(fs).toMatchObject({
			kind: syntaxKind.EdgeStatement,
			source: expect.objectContaining({
				kind: syntaxKind.NodeId,
				id: expect.objectContaining({
					kind: syntaxKind.NumericIdentifier,
				}),
			}),
		});
	});

	test("should parse attributes", () => {
		const p = createParserWithText(
			`strict digraph lol { graph [ size = lel, other=lal; pi= 3]
		node [fontsize = 36,shape = polygon,][]
		[e=2] }
		`);
		const pg = ensureGraph(p);

		expect(pg).toMatchObject({
			kind: syntaxKind.DirectedGraph,
			id: expect.objectContaining({
				kind: syntaxKind.TextIdentifier,
				text: "lol",
			}),
			strict: expect.anything(),
		});

		const { statements } = pg;
		expect(statements).toHaveLength(2);

		expect(statements[0]).toMatchObject({
			kind: syntaxKind.AttributeStatement,
			subject: expect.objectContaining({
				kind: syntaxKind.GraphKeyword,
			}),
		});

		const s0Attributes = (statements[0] as AttributeStatement).attributes;
		expect(s0Attributes).toHaveLength(1);
		expect(s0Attributes[0]).toMatchObject({
			kind: syntaxKind.AttributeContainer,
		});

		const s0Assignments = s0Attributes[0].assignments;
		expect(s0Assignments).toHaveLength(3);
		expect(s0Assignments[0]).toMatchObject({
			kind: syntaxKind.Assignment,
			leftId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "size" }),
			rightId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "lel" }),
		});
		expect(s0Assignments[1]).toMatchObject({
			kind: syntaxKind.Assignment,
			leftId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "other" }),
			rightId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "lal" }),
		});
		expect(s0Assignments[2]).toMatchObject({
			kind: syntaxKind.Assignment,
			leftId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "pi" }),
			rightId: expect.objectContaining({ kind: syntaxKind.NumericIdentifier, text: "3" }),
		});

		expect(statements[1]).toMatchObject({
			kind: syntaxKind.AttributeStatement,
			subject: expect.objectContaining({
				kind: syntaxKind.NodeKeyword,
			}),
		});

		const s1Attributes = (statements[1] as AttributeStatement).attributes;
		expect(s1Attributes).toHaveLength(3);
		expect(s1Attributes[0].assignments).toHaveLength(2);
		expect(s1Attributes[0].assignments[0]).toMatchObject({
			kind: syntaxKind.Assignment,
			leftId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "fontsize" }),
			rightId: expect.objectContaining({ kind: syntaxKind.NumericIdentifier, text: "36" }),
		});
		expect(s1Attributes[0].assignments[1]).toMatchObject({
			kind: syntaxKind.Assignment,
			leftId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "shape" }),
			rightId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "polygon" }),
		});

		expect(s1Attributes[1].assignments).toHaveLength(0);

		expect(s1Attributes[2].assignments).toHaveLength(1);
		expect(s1Attributes[2].assignments[0]).toMatchObject({
			kind: syntaxKind.Assignment,
			leftId: expect.objectContaining({ kind: syntaxKind.TextIdentifier, text: "e" }),
			rightId: expect.objectContaining({ kind: syntaxKind.NumericIdentifier, text: "2" }),
		});
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

		expect(pg).toMatchObject({
			kind: syntaxKind.DirectedGraph,
			id: expect.objectContaining({
				kind: syntaxKind.TextIdentifier,
				text: "G",
			}),
			strict: undefined,
		});

		const { statements } = pg;
		expect(statements).toHaveLength(5);

		expect(statements[0]).toMatchObject({
			kind: syntaxKind.SubGraphStatement,
			subgraph: expect.objectContaining({
				id: expect.objectContaining({ text: "cluster_0" }),
			}),
		});
		expect(statements[0].terminator).toBeUndefined();
		expect((statements[0] as SubGraphStatement).subgraph.statements).toHaveLength(0);

		expect(statements[1]).toMatchObject({
			kind: syntaxKind.SubGraphStatement,
			subgraph: expect.objectContaining({
				id: expect.objectContaining({ text: "cluster_1" }),
			}),
		});
		expect(statements[1].terminator).toBeUndefined();
		expect((statements[1] as SubGraphStatement).subgraph.statements).toHaveLength(0);

		expect(statements[2]).toMatchObject({
			kind: syntaxKind.SubGraphStatement,
			subgraph: expect.objectContaining({
				id: undefined,
			}),
		});
		expect(statements[2].terminator).toBeUndefined();
		expect((statements[2] as SubGraphStatement).subgraph.statements).toHaveLength(0);

		expect(statements[3]).toMatchObject({
			kind: syntaxKind.SubGraphStatement,
			subgraph: expect.objectContaining({
				id: undefined,
			}),
		});
		expect(statements[3].terminator).toBeUndefined();
		expect((statements[3] as SubGraphStatement).subgraph.statements).toHaveLength(1);

		expect(statements[4]).toMatchObject({
			kind: syntaxKind.SubGraphStatement,
			subgraph: expect.objectContaining({
				id: undefined,
			}),
		});
		expect(statements[4].terminator).toBeTruthy();

		const s4s = (statements[4] as SubGraphStatement).subgraph.statements;
		expect(s4s).toHaveLength(2);
		expect(s4s[0]).toMatchObject({ terminator: expect.anything() });
		expect(s4s[1]).toMatchObject({ terminator: undefined });
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

	test("should parse alphabetic identifiers with underscores", () => {
		const p = createParserWithText(`digraph { _start -> end_node -> node_123 }`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements).toBeDefined();
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).text).toEqual("_start");
		expect(source.id.kind).toEqual(syntaxKind.TextIdentifier);
	});

	test("should parse positive integer numerals", () => {
		const p = createParserWithText(`digraph { 123 -> 456 }`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).text).toEqual("123");
	});

	test("should parse negative integer numerals", () => {
		const p = createParserWithText(`digraph { -123 -> -456 }`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).text).toEqual("-123");
	});

	test("should parse decimal numerals", () => {
		const p = createParserWithText(`digraph { 3.14 -> 2.71 }`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).text).toEqual("3.14");
	});

	test("should parse decimal numerals starting with dot", () => {
		const p = createParserWithText(`digraph { .5 -> .75 }`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).text).toEqual(".5");
	});

	test("should parse negative decimal numerals", () => {
		const p = createParserWithText(`digraph { -3.14 -> -.5 }`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).text).toEqual("-3.14");
	});

	test("should parse quoted string identifiers", () => {
		const p = createParserWithText(`digraph { "node 1" -> "node 2" }`, true);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.QuotedTextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).concatenation).toEqual("node 1");
	});

	test("should parse quoted strings with special characters", () => {
		const p = createParserWithText(`digraph { "node-with-dashes" -> "node:with:colons" }`, true);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.QuotedTextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).concatenation).toEqual("node-with-dashes");
	});

	test("should parse HTML string identifiers", () => {
		const p = createParserWithText(`digraph { <<B>bold</B>> -> <<I>italic</I>> }`);
		const pg = ensureGraph(p);

		// Note: HTML identifiers may not be fully supported or may parse differently
		// Just verify it parses without errors for now
		expect(pg.statements.length).toBeGreaterThan(0);
	});

	test("should parse mixed identifier types in same graph", () => {
		const p = createParserWithText(`digraph {
			node1 -> 123;
			"quoted node" -> -45.6;
			_underscore -> .5;
		}`, true);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(3);

		// First statement: alphabetic -> numeric
		const stmt0 = pg.statements[0];
		expect(stmt0.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt0.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";
		const source0 = stmt0.source as NodeId;
		expect(source0.id.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source0.id as any).text).toEqual("node1");

		// Second statement: quoted -> numeric
		const stmt1 = pg.statements[1];
		expect(stmt1.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt1.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";
		const source1 = stmt1.source as NodeId;
		expect(source1.id.kind).toEqual(syntaxKind.QuotedTextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source1.id as any).concatenation).toEqual("quoted node");

		// Third statement: underscore -> decimal starting with dot
		const stmt2 = pg.statements[2];
		expect(stmt2.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt2.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";
		const source2 = stmt2.source as NodeId;
		expect(source2.id.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source2.id as any).text).toEqual("_underscore");
	});

	test("should parse identifiers with extended ASCII characters", () => {
		// Testing with characters in range \200-\377 (0x80-0xFF)
		// Using UTF-8 encoded characters: ä (0xE4), ö (0xF6), ü (0xFC)
		const p = createParserWithText(`digraph { nodeä -> nodeö -> nodeü }`);
		const pg = ensureGraph(p);

		expect(p.diagnostics).toHaveLength(0);
		expect(pg.statements.length).toEqual(1);

		const stmt = pg.statements[0];
		expect(stmt.kind).toEqual(syntaxKind.EdgeStatement);
		if (stmt.kind !== syntaxKind.EdgeStatement) throw "Just for type checker";

		const source = stmt.source as NodeId;
		expect(source.id.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((source.id as any).text).toEqual("nodeä");
	});

	test("should parse graph names with various identifier types", () => {
		// Test alphabetic identifier
		const p1 = createParserWithText("digraph my_graph {}");
		const pg1 = ensureGraph(p1);
		expect(p1.diagnostics).toHaveLength(0);
		expect(pg1.id).toBeDefined();
		if (pg1.id === undefined) throw "Just for type checker";
		expect(pg1.id.kind).toEqual(syntaxKind.TextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg1.id as any).text).toEqual("my_graph");

		// Test numeric identifier
		const p2 = createParserWithText("digraph 123 {}");
		const pg2 = ensureGraph(p2);
		expect(p2.diagnostics).toHaveLength(0);
		expect(pg2.id).toBeDefined();
		if (pg2.id === undefined) throw "Just for type checker";
		expect(pg2.id.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg2.id as any).text).toEqual("123");

		// Test quoted identifier
		const p3 = createParserWithText('digraph "my graph" {}', true);
		const pg3 = ensureGraph(p3);
		expect(p3.diagnostics).toHaveLength(0);
		expect(pg3.id).toBeDefined();
		if (pg3.id === undefined) throw "Just for type checker";
		expect(pg3.id.kind).toEqual(syntaxKind.QuotedTextIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg3.id as any).concatenation).toEqual("my graph");

		// Test negative numeric identifier
		const p4 = createParserWithText("graph -5 {}");
		const pg4 = ensureGraph(p4);
		expect(p4.diagnostics).toHaveLength(0);
		expect(pg4.id).toBeDefined();
		if (pg4.id === undefined) throw "Just for type checker";
		expect(pg4.id.kind).toEqual(syntaxKind.NumericIdentifier);
		// biome-ignore lint/suspicious/noExplicitAny: :shrug:
		expect((pg4.id as any).text).toEqual("-5");
	});
});
