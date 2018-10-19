import { ensureDocAndSourceFile } from "../testutils";
import { expect } from "chai";
import "mocha";
import { CompletionItem } from "vscode-languageserver-types";

import { getCompletions } from "../../src/service/completion";

function getLabel(c: CompletionItem) {
	return c.label;
}

describe("Attribute completion", () => {
	function invokeIndex(content: string) {
		return (location: string) => {
			const requestOffset = content.indexOf(location) + location.length;
			expect(requestOffset).greaterThan(-1);
			return requestOffset;
		}
	}

	it("should provide completion for attributes (empty list)", () => {
		const content = `graph {
			node_name_a -- node_name_b [];
		}`;
		const requestOffset = invokeIndex(content)("[");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
	});

	it("should provide completion for attributes (empty list, a lot of whitespace)", () => {
		const content = `graph {
			node_name_a -- node_name_b [    ];
		}`;

		const requestOffset = invokeIndex(content)("[  ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
	});

	it("should provide completion for attributes (preceeding item)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue,];
		}`;
		const requestOffset = invokeIndex(content)("color=blue,");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
	});

	it("should provide completion for attributes (preceeding item, leading whitespace)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue, ];
		}`;
		const requestOffset = invokeIndex(content)("color=blue, ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
	});

	it("should provide completion for attributes (preceeding item, leading whitespace, linebreak)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue,
			];
		}`;
		const requestOffset = invokeIndex(content)("color=blue, \n\t\t\t");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
	});
});
