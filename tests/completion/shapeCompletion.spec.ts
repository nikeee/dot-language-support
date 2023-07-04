import { describe, test, expect } from "vitest";

import { ensureDocAndSourceFile, getLabel, assertExists } from "../testutils.js";
import { getCompletions } from "../../src/service/completion.js";
import { shapes } from "../../src/service/languageFacts.js";
import { CheckError, DiagnosticCategory, ErrorSource } from "../../src/types.js";

describe("Shape completion", () => {

	test("should provide completion for shapes (trailing attribute)", () => {
		const content = `graph {
			a -- b [shape=];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).toHaveLength(shapes.length);
	});

	test("should provide completion for shapes (leading attribute)", () => {
		const content = `graph {
			a -- b [shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).toHaveLength(shapes.length);
	});

	test("should provide completion for shapes (center attribute)", () => {
		const content = `graph {
			a -- b [label="hi!",shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).toHaveLength(shapes.length);
	});

	test("should provide completion for shapes (center attribute with spaces)", () => {
		const content = `graph {
                a -- b [label="hi!" , shape=,  shape=box];
            }`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).toHaveLength(shapes.length);
	});

	test("should provide completion for shapes (center attribute with spaces and semicolons)", () => {
		const content = `graph {
                a -- b [label="hi!" ; shape=;  shape=box];
            }`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).toHaveLength(shapes.length);
	});

	test("should provide completion for shapes (center attribute mixed spaces and separators)", () => {
		const content = `graph {
                a -- b [label="hi!" ,shape=;
                 shape=box];
            }`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).toHaveLength(shapes.length);
	});

	test("should validate shapes (single node)", () => {
		let [doc, sf] = ensureDocAndSourceFile(`graph { b [shape=box]; }`);
		expect(sf.diagnostics).toHaveLength(0);

		[doc, sf] = ensureDocAndSourceFile(`graph { b [shape=test]; }`);
		expect(sf.diagnostics).toHaveLength(1);
		expect(sf.diagnostics).toStrictEqual([{
			message: `Unknown shape "test".`,
			code: { source: ErrorSource.Check, sub: CheckError.InvalidShapeName },
			category: DiagnosticCategory.Warning,
			start: 11,
			end: 21,
		}]);
	});

	test("should validate shapes (all nodes)", () => {
		let [doc, sf] = ensureDocAndSourceFile(`graph { node [shape=box]; }`);
		expect(sf.diagnostics).toHaveLength(0);

		[doc, sf] = ensureDocAndSourceFile(`graph { node [shape=test]; }`);
		expect(sf.diagnostics).toHaveLength(1);
		expect(sf.diagnostics).toStrictEqual([{
			message: `Unknown shape "test".`,
			code: { source: ErrorSource.Check, sub: CheckError.InvalidShapeName },
			category: DiagnosticCategory.Warning,
			start: 14,
			end: 24,
		}]);
	});
});
