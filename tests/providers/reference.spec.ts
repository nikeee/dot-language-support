import { expect } from "chai";
import "mocha";

import { ensureDocAndSourceFile } from "../testutils.js";
import { findReferences } from "../../src/service/reference.js";

describe("Reference Finding", () => {

	function findReferencesSample(content: string, includeDeclaration: boolean) {
		return (offset: number) => {
			const [doc, sf] = ensureDocAndSourceFile(content);
			const refs = findReferences(doc, sf, doc.positionAt(offset), { includeDeclaration });

			expect(refs).to.exist;
			if (!refs) throw "Just for the type checker";

			return refs;
		}
	}

	it("should correctly return all references (including self)", () => {
		const as = findReferencesSample(`graph {a a b a}`, true);

		const refs = as(9);
		expect(refs).to.exist;
		expect(refs).to.have.length(3);

		expect(refs[0].range.start.character).to.equal(7);
		expect(refs[0].range.end.character).to.equal(8);
		expect(refs[0].range.start.line).to.equal(0);
		expect(refs[0].range.end.line).to.equal(0);

		expect(refs[1].range.start.character).to.equal(9);
		expect(refs[1].range.end.character).to.equal(10);
		expect(refs[1].range.start.line).to.equal(0);
		expect(refs[1].range.end.line).to.equal(0);

		expect(refs[2].range.start.character).to.equal(13);
		expect(refs[2].range.end.character).to.equal(14);
		expect(refs[2].range.start.line).to.equal(0);
		expect(refs[2].range.end.line).to.equal(0);
	});

	it("should correctly return all references (excluding self)", () => {
		const as = findReferencesSample(`graph {a a b a}`, false);

		const refs = as(9);
		expect(refs).to.exist;
		expect(refs).to.have.length(2);

		expect(refs[0].range.start.character).to.equal(7);
		expect(refs[0].range.end.character).to.equal(8);
		expect(refs[0].range.start.line).to.equal(0);
		expect(refs[0].range.end.line).to.equal(0);

		// This one is excluded:
		// expect(refs[1].range.start.character).to.equal(9);
		// expect(refs[1].range.end.character).to.equal(10);
		// expect(refs[1].range.start.line).to.equal(0);
		// expect(refs[1].range.end.line).to.equal(0);

		expect(refs[1].range.start.character).to.equal(13);
		expect(refs[1].range.end.character).to.equal(14);
		expect(refs[1].range.start.line).to.equal(0);
		expect(refs[1].range.end.line).to.equal(0);
	});
});
