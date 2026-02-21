import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile, getLabel } from "../testUtils.ts";
import { getCompletions } from "../../src/service/completion.ts";
import { shapes } from "../../src/service/languageFacts.ts";
import { checkError, diagnosticCategory, errorSource } from "../../src/types.ts";

void describe("Shape completion", () => {
	void test("should provide completion for shapes (trailing attribute)", () => {
		const content = `graph {
			a -- b [shape=];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		const labels = completions.map(getLabel);
		expect(labels).toEqual(shapes);
	});

	void test("should provide completion for shapes (leading attribute)", () => {
		const content = `graph {
			a -- b [shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		const labels = completions.map(getLabel);
		expect(labels).toEqual(shapes);
	});

	void test("should provide completion for shapes (center attribute)", () => {
		const content = `graph {
			a -- b [label="hi!",shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		const labels = completions.map(getLabel);
		expect(labels).toEqual(shapes);
	});

	void test("should provide completion for shapes (center attribute with spaces)", () => {
		const content = `graph { a -- b [label="hi!" , shape=,  shape=box]; }`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		const labels = completions.map(getLabel);
		expect(labels).toEqual(shapes);
	});

	void test("should provide completion for shapes (center attribute with spaces and semicolons)", () => {
		const content = `graph { a -- b [label="hi!" ; shape=;  shape=box];}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		const labels = completions.map(getLabel);
		expect(labels).toEqual(shapes);
	});

	void test("should provide completion for shapes (center attribute mixed spaces and separators)", () => {
		const content = `graph {
			a -- b [label="hi!" ,shape=;
				shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		const labels = completions.map(getLabel);
		expect(labels).toEqual(shapes);
	});

	void test("should validate shapes (single node)", () => {
		let [_doc, sf] = ensureDocAndSourceFile(`graph { b [shape=box]; }`);
		expect(sf.diagnostics).toHaveLength(0);

		[_doc, sf] = ensureDocAndSourceFile(`graph { b [shape=test]; }`);
		expect(sf.diagnostics).toHaveLength(1);
		expect(sf.diagnostics).toStrictEqual([
			{
				message: `Unknown shape "test".`,
				code: { source: errorSource.Check, sub: checkError.InvalidShapeName },
				category: diagnosticCategory.Warning,
				start: 17,
				end: 21,
			},
		]);
	});

	void test("should validate shapes (all nodes)", () => {
		let [_doc, sf] = ensureDocAndSourceFile(`graph { node [shape=box]; }`);
		expect(sf.diagnostics).toHaveLength(0);

		[_doc, sf] = ensureDocAndSourceFile(`graph { node [shape=test]; }`);
		expect(sf.diagnostics).toHaveLength(1);
		expect(sf.diagnostics).toStrictEqual([
			{
				message: `Unknown shape "test".`,
				code: { source: errorSource.Check, sub: checkError.InvalidShapeName },
				category: diagnosticCategory.Warning,
				start: 20,
				end: 24,
			},
		]);
	});

	test("should validate graph with Mdiamond and Msquare shapes", () => {
		const [_doc, sf] = ensureDocAndSourceFile(`digraph G { start -> end; start [shape=Mdiamond]; end [shape=Msquare]; }`);
		expect(sf.diagnostics).toHaveLength(0);
	});

	test("should validate graph with quoted identifier", () => {
		const [_doc, sf] = ensureDocAndSourceFile(`digraph G { "start" [shape=Mdiamond] }`);
		expect(sf.diagnostics).toHaveLength(0);
	});

	test("should allow underscores as identifier", () => {
		const [_doc, sf] = ensureDocAndSourceFile(`digraph {_a->b}`);
		expect(sf.diagnostics).toHaveLength(0);
	});
});
