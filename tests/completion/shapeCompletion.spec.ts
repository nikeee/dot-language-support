import { ensureDocAndSourceFile, ensureGraph } from "../testutils";
import { SyntaxKind } from "../../src/types";
import { expect } from "chai";
import "mocha";

import { getCompletions } from "../../src/service/completion";

describe("Shape completion", () => {

	it("should provide completion for shapes (trailing attribute)", () => {
		const content = `graph {
			a -- b [shape=];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});

	it("should provide completion for shapes (leading attribute)", () => {
		const content = `graph {
			a -- b [shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});

	it("should provide completion for shapes (center attribute)", () => {
		const content = `graph {
			a -- b [label="hi!",shape=,shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});

	it("should provide completion for shapes (center attribute with spaces)", () => {
		const content = `graph {
			a -- b [label="hi!" , shape=,  shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});

	it("should provide completion for shapes (center attribute with spaces and semicolons)", () => {
		const content = `graph {
			a -- b [label="hi!" ; shape=;  shape=box];
		}`;
		const requestOffset = content.indexOf("shape=") + "shape=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
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
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});
});
