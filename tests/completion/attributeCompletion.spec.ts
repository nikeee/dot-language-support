import { ensureDocAndSourceFile } from "../testutils";
import { expect } from "chai";
import "mocha";

import { getCompletions } from "../../src/service/completion";

describe("Attribute completion", () => {
	it("should provide completion for attributes (empty list)", () => {
		const content = `graph {
			a -- b [];
		}`;
		const requestOffset = content.indexOf("[") + "[".length;
		expect(requestOffset).greaterThan(-1);

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});

	it("should provide completion for attributes (preceeding item)", () => {
		const content = `graph {
			a -- b [color=blue,];
		}`;
		const requestOffset = content.indexOf("color=blue,") + "color=blue,".length;
		expect(requestOffset).greaterThan(-1);

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});

	it("should provide completion for attributes (preceeding item, leading whitespace)", () => {
		const content = `graph {
			a -- b [color=blue, ];
		}`;
		const requestOffset = content.indexOf("color=blue, ") + "color=blue, ".length;
		expect(requestOffset).greaterThan(-1);

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});

	it("should provide completion for attributes (preceeding item, leading whitespace, linebreak)", () => {
		const content = `graph {
			a -- b [color=blue,
			];
		}`;
		const requestOffset = content.indexOf("color=blue, \n\t\t\t") + "color=blue, \n\t\t\t".length;
		expect(requestOffset).greaterThan(-1);

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
	});
});
