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
			// biome-ignore lint/style/noNonNullAssertion: :shrug:
			return refs!;
		};
	}

	test("should correctly find reference (referring other)", () => {
		const as = findDefinitionSample(`graph {a a b a}`);

		const def = as(9);
		expect(def).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 7, line: 0 }),
				end: expect.objectContaining({ character: 8, line: 0 }),
			}),
		});
	});

	test("should correctly find reference (referring other)", () => {
		const as = findDefinitionSample(`graph {a a b a}`);

		const def = as(7);
		expect(def).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 7, line: 0 }),
				end: expect.objectContaining({ character: 8, line: 0 }),
			}),
		});
	});
});
