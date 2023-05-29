import { describe, test, expect } from "vitest";

import { ensureDocAndSourceFile } from "../testutils.js";
import { findReferences } from "../../src/service/reference.js";

describe("Reference Finding", () => {

	function findReferencesSample(content: string, includeDeclaration: boolean) {
		return (offset: number) => {
			const [doc, sf] = ensureDocAndSourceFile(content);
			const refs = findReferences(doc, sf, doc.positionAt(offset), { includeDeclaration });

			expect(refs).toBeDefined();
			if (!refs) throw "Just for the type checker";

			return refs;
		};
	}

	test("should correctly return all references (including self)", () => {
		const as = findReferencesSample(`graph {a a b a}`, true);

		const refs = as(9);
		expect(refs).toBeDefined();
		expect(refs).toHaveLength(3);

		expect(refs[0].range.start.character).toEqual(7);
		expect(refs[0].range.end.character).toEqual(8);
		expect(refs[0].range.start.line).toEqual(0);
		expect(refs[0].range.end.line).toEqual(0);

		expect(refs[1].range.start.character).toEqual(9);
		expect(refs[1].range.end.character).toEqual(10);
		expect(refs[1].range.start.line).toEqual(0);
		expect(refs[1].range.end.line).toEqual(0);

		expect(refs[2].range.start.character).toEqual(13);
		expect(refs[2].range.end.character).toEqual(14);
		expect(refs[2].range.start.line).toEqual(0);
		expect(refs[2].range.end.line).toEqual(0);
	});

	test("should correctly return all references (excluding self)", () => {
		const as = findReferencesSample(`graph {a a b a}`, false);

		const refs = as(9);
		expect(refs).toBeDefined();
		expect(refs).toHaveLength(2);

		expect(refs[0].range.start.character).toEqual(7);
		expect(refs[0].range.end.character).toEqual(8);
		expect(refs[0].range.start.line).toEqual(0);
		expect(refs[0].range.end.line).toEqual(0);

		// This one is excluded:
		// expect(refs[1].range.start.character).to.equal(9);
		// expect(refs[1].range.end.character).to.equal(10);
		// expect(refs[1].range.start.line).to.equal(0);
		// expect(refs[1].range.end.line).to.equal(0);

		expect(refs[1].range.start.character).toEqual(13);
		expect(refs[1].range.end.character).toEqual(14);
		expect(refs[1].range.start.line).toEqual(0);
		expect(refs[1].range.end.line).toEqual(0);
	});
});
