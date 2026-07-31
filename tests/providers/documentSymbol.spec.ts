import { describe, test } from "node:test";
import { expect } from "expect";
import { SymbolKind } from "vscode-languageserver-types";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { getDocumentSymbols } from "../../src/service/documentSymbol.ts";

void describe("Document Symbol", () => {
	function getSymbols(content: string) {
		const [doc, sf] = ensureDocAndSourceFile(content);
		return getDocumentSymbols(doc, sf);
	}

	function names(symbols: { name: string; children?: unknown }[]): unknown[] {
		return symbols.map(s => {
			const children = (s.children ?? []) as { name: string; children?: unknown }[];
			return children.length === 0 ? s.name : [s.name, names(children)];
		});
	}

	void test("reports the graph with its nodes as children", () => {
		const symbols = getSymbols("digraph G {\n\ta -> b;\n\tc;\n}");

		expect(names(symbols)).toEqual([["G", ["a", "b", "c"]]]);
		expect(symbols[0].kind).toBe(SymbolKind.Class);
		expect(symbols[0].children?.[0].kind).toBe(SymbolKind.Variable);
	});

	void test("falls back to the keyword when the graph has no id", () => {
		expect(names(getSymbols("digraph { a }"))).toEqual([["digraph", ["a"]]]);
		expect(names(getSymbols("graph { a }"))).toEqual([["graph", ["a"]]]);
		expect(names(getSymbols("strict digraph { a }"))).toEqual([["digraph", ["a"]]]);
	});

	void test("nests subgraphs", () => {
		const symbols = getSymbols(
			"digraph G {\n\ta;\n\tsubgraph cluster_x {\n\t\tb -> c;\n\t}\n}",
		);

		expect(names(symbols)).toEqual([["G", ["a", ["cluster_x", ["b", "c"]]]]]);

		const subgraph = symbols[0].children?.[1];
		expect(subgraph?.kind).toBe(SymbolKind.Namespace);
	});

	void test("handles anonymous subgraphs and subgraphs used as edge endpoints", () => {
		expect(names(getSymbols("digraph { { a } }"))).toEqual([
			["digraph", [["subgraph", ["a"]]]],
		]);
		expect(names(getSymbols("digraph { a -> { b c } }"))).toEqual([
			["digraph", ["a", ["subgraph", ["b", "c"]]]],
		]);
	});

	void test("reports every node only once per scope", () => {
		const symbols = getSymbols("digraph G {\n\ta -> b;\n\tb -> a;\n\ta [color=red];\n}");

		expect(names(symbols)).toEqual([["G", ["a", "b"]]]);
	});

	void test("does not report attribute or graph property statements as symbols", () => {
		const symbols = getSymbols("digraph G {\n\trankdir=LR;\n\tnode [shape=box];\n\ta;\n}");

		expect(names(symbols)).toEqual([["G", ["a"]]]);
	});

	void test("selection range is inside the full range", () => {
		const content = "digraph G {\n\ta -> b;\n}";
		const [doc, sf] = ensureDocAndSourceFile(content);
		const symbols = getDocumentSymbols(doc, sf);

		const graph = symbols[0];
		const offsetOf = (p: { line: number; character: number }) => doc.offsetAt(p);

		expect(offsetOf(graph.range.start)).toBe(0);
		expect(offsetOf(graph.range.end)).toBe(content.length);
		expect(offsetOf(graph.selectionRange.start)).toBe(content.indexOf("G"));
		expect(offsetOf(graph.selectionRange.end)).toBe(content.indexOf("G") + 1);

		const nodeA = graph.children?.[0];
		expect(nodeA && offsetOf(nodeA.selectionRange.start)).toBe(content.indexOf("a ->"));
	});

	void test("returns nothing when there is no graph", () => {
		expect(getSymbols("")).toEqual([]);
		expect(getSymbols("// just a comment")).toEqual([]);
	});
});
