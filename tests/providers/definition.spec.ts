import { expect } from "chai";
import "mocha";

import { ensureDocAndSourceFile } from "../testutils.js";
import { findDefinition } from "../../src/service/reference.js";

describe("Definition Finding", () => {

	function findDefinitionSample(content: string) {
		return (offset: number) => {
			const [doc, sf] = ensureDocAndSourceFile(content);
			const refs = findDefinition(doc, sf, doc.positionAt(offset));

			expect(refs).to.exist;
			if (!refs) throw "Just for the type checker";

			return refs;
		}
	}

	it("should correctly find reference (referring other)", () => {
		const as = findDefinitionSample(`graph {a a b a}`);

		const def = as(9);
		expect(def).to.exist;
		expect(def.range).to.exist;
		expect(def.range.start).to.exist;
		expect(def.range.end).to.exist;

		expect(def.range.start.character).to.equal(7);
		expect(def.range.end.character).to.equal(8);
		expect(def.range.start.line).to.equal(0);
		expect(def.range.end.line).to.equal(0);
	});

	it("should correctly find reference (referring other)", () => {
		const as = findDefinitionSample(`graph {a a b a}`);

		const def = as(7);
		expect(def).to.exist;
		expect(def.range).to.exist;
		expect(def.range.start).to.exist;
		expect(def.range.end).to.exist;

		expect(def.range.start.character).to.equal(7);
		expect(def.range.end.character).to.equal(8);
		expect(def.range.start.line).to.equal(0);
		expect(def.range.end.line).to.equal(0);
	});
});
