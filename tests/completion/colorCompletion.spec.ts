import { describe, test } from "node:test";
import { expect } from "expect";

import { ensureDocAndSourceFile, getLabel } from "../testUtils.ts";
import { getCompletions } from "../../src/service/completion.ts";
import { colors } from "../../src/service/languageFacts.ts";

const allColors = Object.keys(colors);

describe("Color completion", () => {

	test("should provide completion for colors (trailing attribute)", () => {
		const content = `graph {
			a -- b [color=];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));
		expect(completions).toBeTruthy();

		const labels = completions.map(getLabel);
		expect(labels).toEqual(allColors);
	});

	test("should provide completion for colors (leading attribute)", () => {
		const content = `graph {
			a -- b [color=,shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));
		expect(completions).toBeTruthy();

		const labels = completions.map(getLabel);
		expect(labels).toEqual(allColors);
	});

	test("should provide completion for colors (center attribute)", () => {
		const content = `graph {
			a -- b [label="hi!",color=,shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));
		expect(completions).toBeTruthy();

		const labels = completions.map(getLabel);
		expect(labels).toEqual(allColors);
	});

	test("should provide completion for colors (center attribute with spaces)", () => {
		const content = `graph {
			a -- b [label="hi!" , color=,  shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));
		expect(completions).toBeTruthy();

		const labels = completions.map(getLabel);
		expect(labels).toEqual(allColors);
	});

	test("should provide completion for colors (center attribute with spaces and semicolons)", () => {
		const content = `graph {
			a -- b [label="hi!" ; color=;  shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));
		expect(completions).toBeTruthy();

		const labels = completions.map(getLabel);
		expect(labels).toEqual(allColors);
	});

	test("should provide completion for colors (center attribute mixed spaces and separators)", () => {
		const content = `graph {
			a -- b [label="hi!" ,color=;
				shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));
		expect(completions).toBeTruthy();

		const labels = completions.map(getLabel);
		expect(labels).toEqual(allColors);
	});
});
