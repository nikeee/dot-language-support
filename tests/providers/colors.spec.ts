import { expect } from "chai";
import "mocha";

import { ensureDocAndSourceFile } from "../testutils.js";
import { getDocumentColors } from "../../src/service/colorProvider.js";

describe("Reference Finding", () => {

	function getColorsSample(content: string) {
		const [doc, sf] = ensureDocAndSourceFile(content);
		const refs = getDocumentColors(doc, sf);

		expect(refs).to.exist;
		if (!refs) throw "Just for the type checker";

		return refs;
	}

	it("should correctly return all colors ", () => {
		const refs = getColorsSample(`graph {a [color=red] b [color="#00ff00"] c [color="blue"]}`);
		expect(refs).to.exist;
		expect(refs).to.have.length(3);

		expect(refs[0].range.start.character).to.equal(16);
		expect(refs[0].range.end.character).to.equal(16 + 3);
		expect(refs[0].range.start.line).to.equal(0);
		expect(refs[0].range.end.line).to.equal(0);

		expect(refs[1].range.start.character).to.equal(30);
		expect(refs[1].range.end.character).to.equal(30 + "'#123456'".length);
		expect(refs[1].range.start.line).to.equal(0);
		expect(refs[1].range.end.line).to.equal(0);

		expect(refs[2].range.start.character).to.equal(50);
		expect(refs[2].range.end.character).to.equal(50 + '"blue"'.length);
		expect(refs[2].range.start.line).to.equal(0);
		expect(refs[2].range.end.line).to.equal(0);
	});
});
