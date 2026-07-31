import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { getFoldingRanges } from "../../src/service/foldingRange.ts";

void describe("Folding Range", () => {
	function getRanges(content: string) {
		const [doc, sf] = ensureDocAndSourceFile(content);
		return getFoldingRanges(doc, sf);
	}

	void test("folds the graph body, keeping the closing brace visible", () => {
		const ranges = getRanges(["digraph G {", "\ta -> b;", "\tb -> c;", "}"].join("\n"));

		expect(ranges).toEqual([{ startLine: 0, endLine: 2 }]);
	});

	void test("folds nested subgraphs", () => {
		const ranges = getRanges(
			["digraph {", "\tsubgraph cluster_a {", "\t\ta -> b;", "\t}", "}"].join("\n"),
		);

		expect(ranges).toEqual([
			{ startLine: 0, endLine: 3 },
			{ startLine: 1, endLine: 2 },
		]);
	});

	void test("folds multi-line attribute containers", () => {
		const ranges = getRanges(["graph {", "\ta [", "\t\tcolor=blue,", "\t];", "}"].join("\n"));

		expect(ranges).toEqual([
			{ startLine: 0, endLine: 3 },
			{ startLine: 1, endLine: 2 },
		]);
	});

	void test("ignores single-line constructs", () => {
		expect(getRanges("graph { a -- b; }")).toEqual([]);
		expect(getRanges(["graph {", "\ta [color=blue];", "}"].join("\n"))).toEqual([
			{ startLine: 0, endLine: 1 },
		]);
	});

	void test("handles an empty document and a document without a graph", () => {
		expect(getRanges("")).toEqual([]);
		expect(getRanges("// just a comment")).toEqual([]);
	});

	void test("works with CRLF line endings", () => {
		const ranges = getRanges(["digraph {", "\ta -> b;", "}"].join("\r\n"));

		expect(ranges).toEqual([{ startLine: 0, endLine: 1 }]);
	});
});
