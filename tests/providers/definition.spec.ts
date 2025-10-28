import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { findDefinition } from "../../src/service/reference.ts";

describe("Definition Finding", () => {

	function findDefinitionSample(content: string) {
		return (offset: number) => {
			const [doc, sf] = ensureDocAndSourceFile(content);
			const refs = findDefinition(doc, sf, doc.positionAt(offset));

			expect(refs).toBeDefined();
			if (!refs) throw "Just for the type checker";

			return refs;
		};
	}

	test("should correctly find reference (referring other)", () => {
		const as = findDefinitionSample(`graph {a a b a}`);

		const def = as(9);
		expect(def).toBeDefined();
		expect(def.range).toBeDefined();
		expect(def.range.start).toBeDefined();
		expect(def.range.end).toBeDefined();

		expect(def.range.start.character).toEqual(7);
		expect(def.range.end.character).toEqual(8);
		expect(def.range.start.line).toEqual(0);
		expect(def.range.end.line).toEqual(0);
	});

	test("should correctly find reference (referring other)", () => {
		const as = findDefinitionSample(`graph {a a b a}`);

		const def = as(7);
		expect(def).toBeDefined();
		expect(def.range).toBeDefined();
		expect(def.range.start).toBeDefined();
		expect(def.range.end).toBeDefined();

		expect(def.range.start.character).toEqual(7);
		expect(def.range.end.character).toEqual(8);
		expect(def.range.start.line).toEqual(0);
		expect(def.range.end.line).toEqual(0);
	});
});
