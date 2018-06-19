import { ensureDocAndSourceFile } from "../testutils";
import { expect } from "chai";
import "mocha";

import { getCompletions } from "../../src/service/completion";

describe("Node completion", () => {

	it("should provide completion for nodes", () => {
		const content = `digraph{green->blue;green->yellow;b-> ;}`;
		const requestOffset = content.indexOf("b-> ") + "b-> ".length - 1; // the space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(4); // green, blue, yellow, b
	});

	it("should provide completion for nodes (between nodes)", () => {
		const content = `digraph{green->blue;b-> ;green->yellow}`;
		const requestOffset = content.indexOf("b-> ") + "b-> ".length - 1; // the space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(4); // green, blue, yellow, b
	});

	it("should provide completion for nodes (trailing space)", () => {
		const content = `digraph{green->blue;green->yellow;b->  }`;
		const requestOffset = content.indexOf("b-> ") + "b-> ".length; // latter space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(4); // green, blue, yellow, b
	});

	it("should provide completion for nodes (trailing space; between nodes)", () => {
		const content = `digraph{green->blue;b->  ;green->yellow}`;
		const requestOffset = content.indexOf("b-> ") + "b-> ".length; // latter space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(4); // green, blue, yellow, b
	});
});
