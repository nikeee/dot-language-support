import { ensureDocAndSourceFile, getLabel, assertExists } from "../testutils";
import { expect } from "chai";
import "mocha";

import { getCompletions } from "../../src/service/completion";
import { attributes } from "../../src/service/languageFacts";


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
		const requestOffset = invokeIndex(content)("["); // cursor is at space between [ and ]

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (empty list, a lot of whitespace)", () => {
		const content = `graph {
			node_name_a -- node_name_b [    ];
		}`;

		const requestOffset = invokeIndex(content)("[  ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (preceeding item)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue,];
		}`;
		const requestOffset = invokeIndex(content)("color=blue,");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (preceeding item, leading whitespace)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue, ];
		}`;
		const requestOffset = invokeIndex(content)("color=blue, ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (preceeding item, leading whitespace, linebreak)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue,
			];
		}`;
		const requestOffset = invokeIndex(content)("color=blue,\n\t\t\t");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});



	it("should provide completion for attributes (empty list, first container)", () => {
		const content = `graph {
			node_name_a -- node_name_b [] [shape=box];
		}`;
		const requestOffset = invokeIndex(content)("[");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (empty list, a lot of whitespace, first container)", () => {
		const content = `graph {
			node_name_a -- node_name_b [    ] [shape=box];
		}`;

		const requestOffset = invokeIndex(content)("[  ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (preceeding item, first container)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue,] [shape=box];
		}`;
		const requestOffset = invokeIndex(content)("color=blue,");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (preceeding item, leading whitespace, first container)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue, ] [shape=box];
		}`;
		const requestOffset = invokeIndex(content)("color=blue, ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});

	it("should provide completion for attributes (preceeding item, leading whitespace, linebreak, first container)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue,
			] [shape=box];
		}`;
		const requestOffset = invokeIndex(content)("color=blue,\n\t\t\t");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		assertExists(completions);

		expect(completions).to.have.length.greaterThan(0);
		expect(completions.map(getLabel)).not.to.contain("node_name_a");
		expect(completions.map(getLabel)).not.to.contain("node_name_b");
		expect(completions.map(getLabel)).to.include.members(attributes as any[] /* TODO: See PR to DT */);
		expect(completions).to.have.length(attributes.length);
	});
});
