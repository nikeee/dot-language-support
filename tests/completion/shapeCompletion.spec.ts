import { ensureDocAndSourceFile, getLabel, assertExists } from "../testutils";
import { expect } from "chai";
import "mocha";

import { getCompletions } from "../../src/service/completion";
import { shapes } from "../../src/service/languageFacts";

describe("Shape completion", () => {

	it("should provide completion for shapes (trailing attribute)", () => {
		const content = `graph {
			a -- b [shape=];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(shapes.length);
	});

	it("should provide completion for shapes (leading attribute)", () => {
		const content = `graph {
			a -- b [shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(shapes.length);
	});

	it("should provide completion for shapes (center attribute)", () => {
		const content = `graph {
			a -- b [label="hi!",shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(shapes.length);
	});

	it("should provide completion for shapes (center attribute with spaces)", () => {
		const content = `graph {
			a -- b [label="hi!" , shape=,  shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(shapes.length);
	});

	it("should provide completion for shapes (center attribute with spaces and semicolons)", () => {
		const content = `graph {
			a -- b [label="hi!" ; shape=;  shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(shapes.length);
	});

	it("should provide completion for shapes (center attribute mixed spaces and separators)", () => {
		const content = `graph {
			a -- b [label="hi!" ,shape=;
			 shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).to.include.members(shapes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(shapes.length);
	});
});
