import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { findReferences } from "../../src/service/reference.ts";

void describe("Reference Finding", () => {
	function findReferencesSample(content: string, includeDeclaration: boolean) {
		return (offset: number) => {
			const [doc, sf] = ensureDocAndSourceFile(content);
			const refs = findReferences(doc, sf, doc.positionAt(offset), { includeDeclaration });
			expect(refs).toBeDefined();
			// biome-ignore lint/style/noNonNullAssertion: :shrug:
			return refs!;
		};
	}

	void test("should correctly return all references (including self)", () => {
		const as = findReferencesSample(`graph {a a b a}`, true);

		const refs = as(9);
		expect(refs).toHaveLength(3);

		expect(refs[0]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 7, line: 0 }),
				end: expect.objectContaining({ character: 8, line: 0 }),
			}),
		});

		expect(refs[1]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 9, line: 0 }),
				end: expect.objectContaining({ character: 10, line: 0 }),
			}),
		});

		expect(refs[2]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 13, line: 0 }),
				end: expect.objectContaining({ character: 14, line: 0 }),
			}),
		});
	});

	void test("should correctly return all references (excluding self)", () => {
		const as = findReferencesSample(`graph {a a b a}`, false);

		const refs = as(9);
		expect(refs).toHaveLength(2);

		expect(refs[0]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 7, line: 0 }),
				end: expect.objectContaining({ character: 8, line: 0 }),
			}),
		});

		expect(refs[1]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 13, line: 0 }),
				end: expect.objectContaining({ character: 14, line: 0 }),
			}),
		});
	});
});
