import { describe, test } from "vitest";
import { expect } from "expect";

import { ensureDocAndSourceFile } from "../testutils.ts";
import { getDocumentColors } from "../../src/service/colorProvider.ts";

describe("Reference Finding", () => {

	function getColorsSample(content: string) {
		const [doc, sf] = ensureDocAndSourceFile(content);
		const refs = getDocumentColors(doc, sf);

		expect(refs).toBeDefined();
		if (!refs) throw "Just for the type checker";

		return refs;
	}

	test("should correctly return all colors ", () => {
		const refs = getColorsSample(`graph {a [color=red] b [color="#00ff00"] c [color="blue"]}`);
		expect(refs).toBeDefined();
		expect(refs).toHaveLength(3);

		expect(refs[0].range.start.character).toEqual(16);
		expect(refs[0].range.end.character).toEqual(16 + 3);
		expect(refs[0].range.start.line).toEqual(0);
		expect(refs[0].range.end.line).toEqual(0);

		expect(refs[1].range.start.character).toEqual(30);
		expect(refs[1].range.end.character).toEqual(30 + "'#123456'".length);
		expect(refs[1].range.start.line).toEqual(0);
		expect(refs[1].range.end.line).toEqual(0);

		expect(refs[2].range.start.character).toEqual(50);
		expect(refs[2].range.end.character).toEqual(50 + '"blue"'.length);
		expect(refs[2].range.start.line).toEqual(0);
		expect(refs[2].range.end.line).toEqual(0);
	});
});
