import { ensureDocAndSourceFile, getLabel, assertExists } from "../testutils.js";
import { getCompletions } from "../../src/service/completion.js";
import { attributes } from "../../src/service/languageFacts.js";


describe("Attribute completion", () => {
	function invokeIndex(content: string) {
		return (location: string) => {
			const requestOffset = content.indexOf(location) + location.length;
			expect(requestOffset).toBeGreaterThan(-1);
			return requestOffset;
		};
	}

	it("should provide completion for attributes (empty list)", () => {
		const content = `graph {
			node_name_a -- node_name_b [];
		}`;
		const requestOffset = invokeIndex(content)("["); // cursor is at space between [ and ]

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	});

	it("should provide completion for attributes (empty list, a lot of whitespace)", () => {
		const content = `graph {
                node_name_a -- node_name_b [    ];
            }`;

		const requestOffset = invokeIndex(content)("[  ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);

	it("should provide completion for attributes (preceding item)", () => {
		const content = `graph {
			node_name_a -- node_name_b [color=blue,];
		}`;
		const requestOffset = invokeIndex(content)("color=blue,");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	});

	it("should provide completion for attributes (preceding item, leading whitespace)", () => {
		const content = `graph {
                node_name_a -- node_name_b [color=blue, ];
            }`;
		const requestOffset = invokeIndex(content)("color=blue, ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);

	it("should provide completion for attributes (preceding item, leading whitespace, line break)", () => {
		const content = `graph {
                node_name_a -- node_name_b [color=blue,
                ];
            }`;
		const requestOffset = invokeIndex(content)("color=blue,\n\t\t\t");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);



	it("should provide completion for attributes (empty list, first container)", () => {
		const content = `graph {
                node_name_a -- node_name_b [] [shape=box];
            }`;
		const requestOffset = invokeIndex(content)("[");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);

	it("should provide completion for attributes (empty list, a lot of whitespace, first container)", () => {
		const content = `graph {
                node_name_a -- node_name_b [    ] [shape=box];
            }`;

		const requestOffset = invokeIndex(content)("[  ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);

	it("should provide completion for attributes (preceding item, first container)", () => {
		const content = `graph {
                node_name_a -- node_name_b [color=blue,] [shape=box];
            }`;
		const requestOffset = invokeIndex(content)("color=blue,");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);

	it("should provide completion for attributes (preceding item, leading whitespace, first container)", () => {
		const content = `graph {
                node_name_a -- node_name_b [color=blue, ] [shape=box];
            }`;
		const requestOffset = invokeIndex(content)("color=blue, ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);

	it("should provide completion for attributes (preceding item, leading whitespace, line break, first container)", () => {
		const content = `graph {
                node_name_a -- node_name_b [color=blue,
                ] [shape=box];
            }`;
		const requestOffset = invokeIndex(content)("color=blue,\n\t\t\t");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).not.toContain("node_name_a");
		expect(completions.map(getLabel)).not.toContain("node_name_b");
		expect(completions.map(getLabel)).toEqual(attributes);
		expect(completions).toHaveLength(attributes.length);
	}
	);
});
