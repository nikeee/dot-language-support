import { describe, test, expect } from "vitest";

import { ensureDocAndSourceFile } from "../testutils.js";
import { hover } from "../../src/service/hover.js";

describe("Hover Handling", () => {

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
		}`);

	const hoverAtStrictSampleAtOffset = hoverSample(
		`strict digraph GraphName { // funny comment
				a = b;
				/* aha! */
				c = d e = f g=3; # some other comment
		}`);

	test("should correctly return graph info (offset 0)", () => {
		const h = hoverAtSampleAtOffset(0);
		expect(h.contents).toEqual("(directed graph) GraphName");
	});

	test("Issue #21", () => {
		const h = hoverSample(`digraph{ graph [] }`)("digraph{ g".length);
		expect(h).not.toBeNull();
		expect(h).toBeDefined();
		expect(h.contents).toEqual("(undirected graph)");
	});

	test("should correctly return graph info (offset 3)", () => {
		const h = hoverAtSampleAtOffset(3);
		expect(h.contents).toEqual("(directed graph) GraphName");
	});

	test(`should correctly return graph info (offset ${"digraph".length})`, () => {
		const h = hoverAtSampleAtOffset("digraph".length);
		expect(h.contents).toEqual("(directed graph) GraphName");
	}
	);

	test(`should correctly return graph info (offset ${"digraph Gra".length})`, () => {
		const h = hoverAtSampleAtOffset("digraph Gra".length);
		expect(h.contents).toEqual("(directed graph) GraphName");
	}
	);

	test("should correctly return graph info, strict graph (offset 0)", () => {
		const h = hoverAtStrictSampleAtOffset(0);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	});

	test("should correctly return graph info, strict graph (offset 12)", () => {
		const h = hoverAtStrictSampleAtOffset(12);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	});

	test("should correctly return graph info, strict graph (offset 21)", () => {
		const h = hoverAtStrictSampleAtOffset(21);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	});

	test("should correctly return graph info, unnamed strict graph (offset 0)", () => {
		const h = hoverAtStrictSampleAtOffset(21);
		expect(h.contents).toEqual("(strict directed graph) GraphName");
	}
	);


	test("should correctly return edge info (undirected graph)", () => {
		const hoverAtEdgeSampleAtOffsetUndirected = hoverSample(`graph { a -- b }`);
		const expected = "(edge) a -- b"

		let h = hoverAtEdgeSampleAtOffsetUndirected(9);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetUndirected(10);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetUndirected(11);
		expect(h.contents).toEqual(expected);
	});

	test("should correctly return edge info (directed graph)", () => {
		const hoverAtEdgeSampleAtOffsetDirected = hoverSample(`graph { a -> b }`);
		const expected = "(edge) a -> b"

		let h = hoverAtEdgeSampleAtOffsetDirected(9);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetDirected(10);
		expect(h.contents).toEqual(expected);

		h = hoverAtEdgeSampleAtOffsetDirected(11);
		expect(h.contents).toEqual(expected);
	});


	test("should correctly hover on sub graphs", () => {
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
	test("should correctly show node labels on hover (source node)", () => {
		const hoverOnCode = hoverSample(`graph{ c[label="xd"]; c -- a; c -- b}}`);

		const h = hoverOnCode(7);
		expect(h.contents).toEqual("(node) c: xd");
	});

	/**
	 * See https://github.com/nikeee/dot-language-support/issues/83
	 */
	test("should correctly show node labels on hover (other node)", () => {
		const hoverOnCode = hoverSample(`graph{ c[label="xd"]; c -- a; c -- b}}`);
		const h = hoverOnCode(22);
		expect(h.contents).toEqual("(node) c: xd");
	});

	/**
	 * See https://github.com/nikeee/dot-language-support/issues/83
	 */
	test("should correctly show node labels on hover (other node)", () => {
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
	test("should correctly show node labels on hover (other node)", () => {
		const hoverOnCode = hoverSample(`digraph G {
			vp [label="View Profile"];
			vf [label="View Friends"];

			vp -> vf;
		}`);
		const h = hoverOnCode(81);
		expect(h.contents).toEqual("(node) vf: View Friends");
	});
});
