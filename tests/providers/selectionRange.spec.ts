import { describe, test } from "node:test";
import { expect } from "expect";
import type { SelectionRange } from "vscode-languageserver-types";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { getSelectionRanges } from "../../src/service/selectionRange.ts";

void describe("Selection Range", () => {
	function getSample(content: string) {
		const [doc, sf] = ensureDocAndSourceFile(content);
		return (offset: number) => getSelectionRanges(doc, sf, [doc.positionAt(offset)]);
	}

	function chainLength(sr: SelectionRange): number {
		let n = 0;
		let curr: SelectionRange | undefined = sr;
		while (curr) {
			n++;
			curr = curr.parent;
		}
		return n;
	}

	function chainToOffsets(
		content: string,
		sr: SelectionRange,
	): Array<{ start: number; end: number }> {
		const lines = content.split("\n");
		const offsetAt = (line: number, character: number) => {
			let o = 0;
			for (let i = 0; i < line; i++) o += lines[i].length + 1;
			return o + character;
		};

		const out: Array<{ start: number; end: number }> = [];
		let curr: SelectionRange | undefined = sr;
		while (curr) {
			out.push({
				start: offsetAt(curr.range.start.line, curr.range.start.character),
				end: offsetAt(curr.range.end.line, curr.range.end.character),
			});
			curr = curr.parent;
		}
		return out;
	}

	void test("returns one result per position", () => {
		const content = "graph { a b }";
		const [doc, sf] = ensureDocAndSourceFile(content);
		const results = getSelectionRanges(doc, sf, [doc.positionAt(8), doc.positionAt(10)]);
		expect(results).toHaveLength(2);
	});

	void test("inner range is contained by outer ranges", () => {
		const content = "graph { a b }";
		const sample = getSample(content);
		const [result] = sample(8);

		const offsets = chainToOffsets(content, result);
		expect(offsets.length).toBeGreaterThan(1);

		for (let i = 0; i < offsets.length - 1; i++) {
			const inner = offsets[i];
			const outer = offsets[i + 1];
			expect(outer.start).toBeLessThanOrEqual(inner.start);
			expect(outer.end).toBeGreaterThanOrEqual(inner.end);
		}
	});

	void test("innermost range covers the identifier at cursor", () => {
		const content = "graph { abc }";
		const sample = getSample(content);
		const [result] = sample(9);

		const [innermost] = chainToOffsets(content, result);
		expect(content.slice(innermost.start, innermost.end)).toBe("abc");
	});

	void test("outermost range spans the full graph", () => {
		const content = "graph { a b }";
		const sample = getSample(content);
		const [result] = sample(8);

		const offsets = chainToOffsets(content, result);
		const outermost = offsets[offsets.length - 1];
		expect(content.slice(outermost.start, outermost.end)).toBe(content);
	});

	void test("no duplicate adjacent ranges in the chain", () => {
		const content = "digraph { a -> b }";
		const sample = getSample(content);
		const [result] = sample(10);

		const offsets = chainToOffsets(content, result);
		for (let i = 0; i < offsets.length - 1; i++) {
			const a = offsets[i];
			const b = offsets[i + 1];
			expect(a.start === b.start && a.end === b.end).toBe(false);
		}
	});

	void test("edge cursor nests through edge statement", () => {
		const content = "digraph { a -> b }";
		const sample = getSample(content);
		const [result] = sample(11);
		expect(chainLength(result)).toBeGreaterThan(1);
	});

	void test("falls back to empty range when no graph", () => {
		const [doc, sf] = ensureDocAndSourceFile("");
		const results = getSelectionRanges(doc, sf, [doc.positionAt(0)]);
		expect(results).toHaveLength(1);
		expect(results[0].parent).toBeUndefined();
	});
});
