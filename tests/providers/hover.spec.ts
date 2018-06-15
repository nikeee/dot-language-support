import { ensureDocAndSourceFile } from "../testutils";
import { expect } from "chai";
import "mocha";
import { hover } from "../../src/service/hover";

describe("Hover Handling", () => {

	function hoverSample(content: string, offset: number) {
		const [doc, sf] = ensureDocAndSourceFile(content);
		const h = hover(doc, sf, doc.positionAt(offset));

		expect(h).to.exist;
		if (!h) throw "Just for the type checker";
		expect(h.contents).to.exist;
		expect(h.range).to.exist;

		return h;
	}

	function hoverAtSampleAtOffset(offset: number) {
		return hoverSample(
			`digraph GraphName { // funny comment
				a = b;
				/* aha! */
				c = d e; = f g=3; # some other comment
			}`,
			offset);
	}

	function hoverAtStrictSampleAtOffset(offset: number) {
		return hoverSample(
			`strict digraph GraphName { // funny comment
				a = b;
				/* aha! */
				c = d e = f g=3; # some other comment
			}`,
			offset);
	}

	it("should correctly return graph info (offset 0)", () => {
		const h = hoverAtSampleAtOffset(0);
		expect(h.contents).to.equal("(directed graph) GraphName");
	});

	it("should correctly return graph info (offset 3)", () => {
		const h = hoverAtSampleAtOffset(3);
		expect(h.contents).to.equal("(directed graph) GraphName");
	});

	it("should correctly return graph info (offset " + "digraph".length + ")", () => {
		const h = hoverAtSampleAtOffset("digraph".length);
		expect(h.contents).to.equal("(directed graph) GraphName");
	});

	it("should correctly return graph info (offset " + "digraph Gra".length + ")", () => {
		const h = hoverAtSampleAtOffset("digraph Gra".length);
		expect(h.contents).to.equal("(directed graph) GraphName");
	});

	it("should correctly return graph info, strict graph (offset 0)", () => {
		const h = hoverAtStrictSampleAtOffset(0);
		expect(h.contents).to.equal("(strict directed graph) GraphName");
	});

	it("should correctly return graph info, strict graph (offset 12)", () => {
		const h = hoverAtStrictSampleAtOffset(12);
		expect(h.contents).to.equal("(strict directed graph) GraphName");
	});

	it("should correctly return graph info, strict graph (offset 21)", () => {
		const h = hoverAtStrictSampleAtOffset(21);
		expect(h.contents).to.equal("(strict directed graph) GraphName");
	});

	it("should correctly return graph info, unnamed strict graph (offset 0)", () => {
		const h = hoverAtStrictSampleAtOffset(21);
		expect(h.contents).to.equal("(strict directed graph) GraphName");
	});

	const hoverAtEdgeSampleAtOffsetUndirected = (offset: number) => hoverSample(`graph { a -- b }`, offset);
	const hoverAtEdgeSampleAtOffsetDirected = (offset: number) => hoverSample(`graph { a -> b }`, offset);

	it("should correctly return edge info (undirected graph)", () => {
		const expected = "(edge) a -- b"

		let h = hoverAtEdgeSampleAtOffsetUndirected(9);
		expect(h.contents).to.equal(expected);

		h = hoverAtEdgeSampleAtOffsetUndirected(10);
		expect(h.contents).to.equal(expected);

		h = hoverAtEdgeSampleAtOffsetUndirected(11);
		expect(h.contents).to.equal(expected);
	});

	it("should correctly return edge info (directed graph)", () => {
		const expected = "(edge) a -> b"

		let h = hoverAtEdgeSampleAtOffsetDirected(9);
		expect(h.contents).to.equal(expected);

		h = hoverAtEdgeSampleAtOffsetDirected(10);
		expect(h.contents).to.equal(expected);

		h = hoverAtEdgeSampleAtOffsetDirected(11);
		expect(h.contents).to.equal(expected);
	});

	const hoverSubGraph = (offset: number) => hoverSample("graph{subgraph{c--a;c--b}}", offset);

	it("should correctly hover on sub graphs", () => {
		let h = hoverSubGraph(15);
		expect(h.contents).to.equal("(node) c");

		h = hoverSubGraph(18);
		expect(h.contents).to.equal("(node) a");

		h = hoverSubGraph(20);
		expect(h.contents).to.equal("(node) c");

		h = hoverSubGraph(23);
		expect(h.contents).to.equal("(node) b");

		h = hoverSubGraph(16);
		expect(h.contents).to.equal("(edge) c -- a");

		h = hoverSubGraph(17);
		expect(h.contents).to.equal("(edge) c -- a");
	});
});
