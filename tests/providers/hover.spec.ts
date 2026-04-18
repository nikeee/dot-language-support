import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { hover } from "../../src/service/hover.ts";

void describe("Hover Handling", () => {
	function hoverSample(content: string) {
		return (offset: number) => {
			const [doc, sf] = ensureDocAndSourceFile(content);
			const h = hover(doc, sf, doc.positionAt(offset));

			expect(h).toBeDefined();
			if (!h) throw "Just for the type checker";
			expect(h.contents).toBeDefined();
			expect(h.range).toBeDefined();

			return h;
		};
	}

	const hoverAtSampleAtOffset = hoverSample(
		`digraph GraphName { // funny comment
			a = b;
			/* aha! */
			c = d e; = f g=3; # some other comment
		}`,
	);

	const hoverAtStrictSampleAtOffset = hoverSample(
		`strict digraph GraphName { // funny comment
				a = b;
				/* aha! */
				c = d e = f g=3; # some other comment
		}`,
	);

	void test("should correctly return graph info (offset 0)", () => {
		const h = hoverAtSampleAtOffset(0);
		expect(h.contents).toEqual("(directed graph) GraphName");
	});

	void test("Issue #21", () => {
		const h = hoverSample(`digraph{ graph [] }`)("digraph{ g".length);
		expect(h).not.toBeNull();
		expect(h).toBeDefined();
		expect(h.contents).toEqual("(undirected graph)");
	});

	void test("should correctly return graph info (offset 3)", () => {
		const h = hoverAtSampleAtOffset(3);
		expect(h.contents).toEqual("(directed graph) GraphName");
	});

	test(`should correctly return graph info (offset ${"digraph".length})`, () => {
		const h = hoverAtSampleAtOffset("digraph".length);
		expect(h.contents).toEqual("(directed graph) GraphName");
	});

	test(`should correctly return graph info (offset ${"digraph Gra".length})`, () => {
		const h = hoverAtSampleAtOffset("digraph Gra".length);
		expect(h.contents).toEqual("(directed graph) GraphName");
	});

	void test("should correctly return graph info, strict graph (offset 0)", () => {
		const h = hoverAtStrictSampleAtOffset(0);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	});

	void test("should correctly return graph info, strict graph (offset 12)", () => {
		const h = hoverAtStrictSampleAtOffset(12);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	});

	void test("should correctly return graph info, strict graph (offset 21)", () => {
		const h = hoverAtStrictSampleAtOffset(21);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	});

	void test("should correctly return graph info, unnamed strict graph (offset 0)", () => {
		const h = hoverAtStrictSampleAtOffset(21);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	});

	void test("should correctly return edge info (undirected graph)", () => {
		const hoverAtEdgeSampleAtOffsetUndirected = hoverSample(`graph { a -- b }`);
		const expected = "(edge) a -- b";

		let h = hoverAtEdgeSampleAtOffsetUndirected(9);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetUndirected(10);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetUndirected(11);
		expect(h.contents).toEqual(expected);
	});

	void test("should correctly return edge info (directed graph)", () => {
		const hoverAtEdgeSampleAtOffsetDirected = hoverSample(`graph { a -> b }`);
		const expected = "(edge) a -> b";

		let h = hoverAtEdgeSampleAtOffsetDirected(9);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetDirected(10);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetDirected(11);
		expect(h.contents).toEqual(expected);
	});

	void test("should correctly hover on sub graphs", () => {
		const hoverSubGraph = hoverSample("graph{subgraph{c--a;c--b}}");

		let h = hoverSubGraph(15);
		expect(h.contents).toEqual("(node) c");

		h = hoverSubGraph(18);
		expect(h.contents).toEqual("(node) a");

		h = hoverSubGraph(20);
		expect(h.contents).toEqual("(node) c");

		h = hoverSubGraph(23);
		expect(h.contents).toEqual("(node) b");

		h = hoverSubGraph(16);
		expect(h.contents).toEqual("(edge) c -- a");

		h = hoverSubGraph(17);
		expect(h.contents).toEqual("(edge) c -- a");
	});

	/**
	 * See https://github.com/nikeee/dot-language-support/issues/83
	 */
	void test("should correctly show node labels on hover (source node)", () => {
		const hoverOnCode = hoverSample(`graph{ c[label="xd"]; c -- a; c -- b}}`);

		const h = hoverOnCode(7);
		expect(h.contents).toEqual("(node) c: xd");
	});

	/**
	 * See https://github.com/nikeee/dot-language-support/issues/83
	 */
	void test("should correctly show node labels on hover (other node)", () => {
		const hoverOnCode = hoverSample(`graph{ c[label="xd"]; c -- a; c -- b}}`);
		const h = hoverOnCode(22);
		expect(h.contents).toEqual("(node) c: xd");
	});

	/**
	 * See https://github.com/nikeee/dot-language-support/issues/83
	 */
	void test("should correctly show node labels on hover (other node)", () => {
		const hoverOnCode = hoverSample(`digraph G {
			vp [label="View Profile"];
			vf [label="View Friends"];

			vp -> vf;
		}`);
		const h = hoverOnCode(75);
		expect(h.contents).toEqual("(node) vp: View Profile");
	});

	/**
	 * See https://github.com/nikeee/dot-language-support/issues/83
	 */
	void test("should correctly show node labels on hover (other node)", () => {
		const hoverOnCode = hoverSample(`digraph G {
			vp [label="View Profile"];
			vf [label="View Friends"];

			vp -> vf;
		}`);
		const h = hoverOnCode(81);
		expect(h.contents).toEqual("(node) vf: View Friends");
	});

	void describe("Hover range", () => {
		function hoverRangeSample(content: string) {
			return (offset: number) => {
				const [doc, sf] = ensureDocAndSourceFile(content);
				const h = hover(doc, sf, doc.positionAt(offset));
				expect(h).toBeDefined();
				if (!h || !h.range) throw "Just for the type checker";
				return {
					hover: h,
					start: doc.offsetAt(h.range.start),
					end: doc.offsetAt(h.range.end),
					text: content.substring(doc.offsetAt(h.range.start), doc.offsetAt(h.range.end)),
				};
			};
		}

		void test("graph keyword hover highlights whole graph", () => {
			const content = "digraph G { a -> b }";
			const r = hoverRangeSample(content)(0);
			expect(r.hover.contents).toEqual("(directed graph) G");
			expect(r.start).toEqual(0);
			expect(r.end).toEqual(content.length);
		});

		void test("strict keyword hover highlights whole graph", () => {
			const content = "strict digraph G { a -> b }";
			const r = hoverRangeSample(content)(0);
			expect(r.hover.contents).toEqual("(strict directed graph) G");
			expect(r.start).toEqual(0);
			expect(r.end).toEqual(content.length);
		});

		void test("graph id hover highlights whole graph", () => {
			const content = "digraph GraphName { a -> b }";
			const r = hoverRangeSample(content)("digraph Gra".length);
			expect(r.hover.contents).toEqual("(directed graph) GraphName");
			expect(r.start).toEqual(0);
			expect(r.end).toEqual(content.length);
		});

		void test("edge op hover highlights source..target", () => {
			const content = "graph { aaa -- bbb }";
			const r = hoverRangeSample(content)(content.indexOf("--") + 1);
			expect(r.hover.contents).toEqual("(edge) aaa -- bbb");
			expect(r.text).toEqual("aaa -- bbb");
		});

		void test("edge op hover in chain highlights source..target for that segment", () => {
			const content = "digraph { a -> b -> c }";
			const firstOp = content.indexOf("->");
			const r = hoverRangeSample(content)(firstOp + 1);
			expect(r.hover.contents).toEqual("(edge) a -> b");
			expect(r.text).toEqual("a -> b");
		});

		void test("node id hover highlights only the identifier", () => {
			const content = "graph { aaa -- bbb }";
			const r = hoverRangeSample(content)(content.indexOf("aaa") + 1);
			expect(r.hover.contents).toEqual("(node) aaa");
			expect(r.text).toEqual("aaa");
		});

		void test("assignment hover highlights whole assignment", () => {
			const content = `graph { n [color=red] }`;
			const r = hoverRangeSample(content)(content.indexOf("color") + 1);
			expect(r.hover.contents).toEqual("(assignment) `color` = `red`");
			expect(r.text).toEqual("color=red");
		});

		void test("graph property hover highlights whole statement", () => {
			const content = `digraph { rankdir = LR; a -> b }`;
			const r = hoverRangeSample(content)(content.indexOf("rankdir") + 1);
			expect(r.hover.contents).toEqual("(graph property) `rankdir` = `LR`");
			expect(r.text).toEqual("rankdir = LR;");
		});

		void test("subgraph hover highlights whole subgraph", () => {
			const content = `graph { subgraph cluster_0 { a -- b } }`;
			const r = hoverRangeSample(content)(content.indexOf("cluster_0") + 1);
			expect(r.hover.contents).toEqual("(sub graph) cluster_0");
			expect(r.text).toEqual("subgraph cluster_0 { a -- b }");
		});
	});
});
