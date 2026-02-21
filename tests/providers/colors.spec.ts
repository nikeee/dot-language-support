import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile } from "../testUtils.ts";
import { getDocumentColors } from "../../src/service/colorProvider.ts";

describe("Reference Finding", () => {
	function getColorsSample(content: string) {
		const [doc, sf] = ensureDocAndSourceFile(content);
		const refs = getDocumentColors(doc, sf);
		expect(refs).toBeDefined();
		// biome-ignore lint/style/noNonNullAssertion: :shrug:
		return refs!;
	}

	test("should correctly return all colors ", () => {
		const refs = getColorsSample(`graph {a [color=red] b [color="#00ff00"] c [color="blue"]}`);
		expect(refs).toHaveLength(3);

		expect(refs[0]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 16, line: 0 }),
				end: expect.objectContaining({ character: 19, line: 0 }),
			}),
		});

		expect(refs[1]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 30, line: 0 }),
				end: expect.objectContaining({ character: 39, line: 0 }),
			}),
		});

		expect(refs[2]).toMatchObject({
			range: expect.objectContaining({
				start: expect.objectContaining({ character: 50, line: 0 }),
				end: expect.objectContaining({ character: 56, line: 0 }),
			}),
		});
	});
});
