import { ensureDocAndSourceFile, getLabel  } from "../testutils";
import { expect } from "chai";
import "mocha";

import { getCompletions } from "../../src/service/completion";
import { colors } from "../../src/service/languageFacts";

const allColors = Object.keys(colors);

describe("Color completion", () => {

	it("should provide completion for colors (trailing attribute)", () => {
		const content = `graph {
			a -- b [color=];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(allColors);
		expect(completions).to.have.length(allColors.length);
	});

	it("should provide completion for colors (leading attribute)", () => {
		const content = `graph {
			a -- b [color=,shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(allColors);
		expect(completions).to.have.length(allColors.length);
	});

	it("should provide completion for colors (center attribute)", () => {
		const content = `graph {
			a -- b [label="hi!",color=,shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(allColors);
		expect(completions).to.have.length(allColors.length);
	});

	it("should provide completion for colors (center attribute with spaces)", () => {
		const content = `graph {
			a -- b [label="hi!" , color=,  shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(allColors);
		expect(completions).to.have.length(allColors.length);
	});

	it("should provide completion for colors (center attribute with spaces and semicolons)", () => {
		const content = `graph {
			a -- b [label="hi!" ; color=;  shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(allColors);
		expect(completions).to.have.length(allColors.length);
	});

	it("should provide completion for colors (center attribute mixed spaces and separators)", () => {
		const content = `graph {
			a -- b [label="hi!" ,color=;
			 shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(allColors);
		expect(completions).to.have.length(allColors.length);
	});
});
