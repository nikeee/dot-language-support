import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { findDeclaration, findDefinition } from "../../src/service/reference.ts";

void describe("Declaration Finding", () => {
	function findDeclarationSample(content: string) {
		return (offset: number) => {
			const [doc, sf] = ensureDocAndSourceFile(content);
			const loc = findDeclaration(doc, sf, doc.positionAt(offset));
			expect(loc).toBeDefined();
			// biome-ignore lint/style/noNonNullAssertion: :shrug:
			return loc!;
		};
	}

	void test("returns the first mention when cursor on later reference", () => {
		const as = findDeclarationSample(`graph {a a b a}`);

		const decl = as(9);
		expect(decl).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 7, line: 0 }),
				end: expect.objectContaining({ character: 8, line: 0 }),
			}),
		});
	});

	void test("returns the first mention when cursor on the declaration itself", () => {
		const as = findDeclarationSample(`graph {a a b a}`);

		const decl = as(7);
		expect(decl).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 7, line: 0 }),
				end: expect.objectContaining({ character: 8, line: 0 }),
			}),
		});
	});

	void test("matches findDefinition result", () => {
		const [doc, sf] = ensureDocAndSourceFile(`graph {a a b a}`);
		const pos = doc.positionAt(13);
		expect(findDeclaration(doc, sf, pos)).toEqual(findDefinition(doc, sf, pos));
	});
});
