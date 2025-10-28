import { describe, test } from "vitest";
import { expect } from "expect";

import { ensureDocAndSourceFile, getRequestOffset, assertExists } from "../testutils.js";
import { getCompletions } from "../../src/service/completion.js";

describe("Node completion", () => {

	test("should provide completion for nodes", () => {
		const content = `digraph{green->blue;green->yellow;b-> ;}`;
		const requestOffset = content.indexOf("b-> ") + "b-> ".length - 1; // the space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(4); // green, blue, yellow, b
	});

	test("should provide completion for nodes (between nodes)", () => {
		const content = `digraph{green->blue;b-> ;green->yellow}`;
		const requestOffset = content.indexOf("b-> ") + "b-> ".length - 1; // the space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(4); // green, blue, yellow, b
	});

	test("should provide completion for nodes (trailing space)", () => {
		const content = `digraph{green->blue;green->yellow;b->  }`;
		const requestOffset = getRequestOffset(content, "b-> "); // latter space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(4); // green, blue, yellow, b
	});

	test("should provide completion for nodes (trailing space; between nodes)", () => {
		const content = `digraph{green->blue;b->  ;green->yellow}`;
		const requestOffset = getRequestOffset(content, "b-> "); // latter space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(4); // green, blue, yellow, b
	});

	test("should provide completion for nodes (trailing space; between nodes, undirected)", () => {
		const content = `graph{node_0;node_1;node_2;node_0 -- node_1 -- [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 --") + "node_1 --".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // node_{0,1,2}
	});

	test("should provide completion for nodes (trailing space; between nodes, directed)", () => {
		const content = `digraph{node_0;node_1;node_2;node_0 -> node_1 -> [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 ->") + "node_1 ->".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // node_{0,1,2}
	});

	test("should provide completion for nodes (trailing space; between nodes, undirected)", () => {
		const content = `graph{node_0;node_1;node_2;node_0 -- node_1 -- [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 -- ") + "node_1 -".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // node_{0,1,2}
	});

	test("should provide completion for nodes (trailing space; between nodes, directed)", () => {
		const content = `digraph{node_0;node_1;node_2;node_0 -> node_1 -> [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 -> ") + "node_1 -".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // node_{0,1,2}
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 1)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast -> [color=gray]
		}`;
		const requestOffset = getRequestOffset(content, "breakfast ->");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 2)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast -> [color=gray]
		}`;
		const requestOffset = getRequestOffset(content, "breakfast ->");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 3)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast ->[color=gray]
		}`;
		const requestOffset = getRequestOffset(content, "breakfast ->");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 4)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast ->[color=gray,]
		}`;
		const requestOffset = getRequestOffset(content, "color=gray,");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(170); // music_bus, breakfast, sell_game
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 5)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast -> [color=gray]
		}`;
		const requestOffset = getRequestOffset(content, "breakfast ->");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 6)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast -> [              color=gray]
		}`;
		const requestOffset = getRequestOffset(content, "breakfast -> ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		// console.log(completions)
		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 7)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast ->  [color=gray]
		}`;
		const requestOffset = getRequestOffset(content, "breakfast -> ");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 8)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast -> sel [color=gray]
		}`;
		const requestOffset = getRequestOffset(content, "breakfast -> sel");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game (excluding sel)
	});

	test("should provide completion for nodes (trailing space; between nodes, issue #17 9)", () => {
		const content = `digraph {
			music_bus [label="Which music would you like to listen to on the bus?"]
			breakfast [label="What breakfast do you want to eat?"]
			sell_game [label="Do you want to program bandersnatch at the company?"]

			music_bus -> breakfast -> sell_game [color=gray]

			s
		}`;
		const requestOffset = getRequestOffset(content, "\ts\n") - 1;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions).toHaveLength(3); // music_bus, breakfast, sell_game
	});
});
