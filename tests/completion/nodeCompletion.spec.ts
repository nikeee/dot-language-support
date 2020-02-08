import { ensureDocAndSourceFile, getRequestOffset } from "../testutils";
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
		const requestOffset = getRequestOffset(content, "b-> "); // latter space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(4); // green, blue, yellow, b
	});

	it("should provide completion for nodes (trailing space; between nodes)", () => {
		const content = `digraph{green->blue;b->  ;green->yellow}`;
		const requestOffset = getRequestOffset(content, "b-> "); // latter space between > and ;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(4); // green, blue, yellow, b
	});

	it("should provide completion for nodes (trailing space; between nodes, undirected)", () => {
		const content = `graph{node_0;node_1;node_2;node_0 -- node_1 -- [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 --") + "node_1 --".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(3); // node_{0,1,2}
	});

	it("should provide completion for nodes (trailing space; between nodes, directed)", () => {
		const content = `digraph{node_0;node_1;node_2;node_0 -> node_1 -> [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 ->") + "node_1 ->".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(3); // node_{0,1,2}
	});

	it("should provide completion for nodes (trailing space; between nodes, undirected)", () => {
		const content = `graph{node_0;node_1;node_2;node_0 -- node_1 -- [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 -- ") + "node_1 -".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(3); // node_{0,1,2}
	});

	it("should provide completion for nodes (trailing space; between nodes, directed)", () => {
		const content = `digraph{node_0;node_1;node_2;node_0 -> node_1 -> [color=gray]; }`;
		const requestOffset = content.indexOf("node_1 -> ") + "node_1 -".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(3); // node_{0,1,2}
	});

	it("should provide completion for nodes (trailing space; between nodes, issue #17 1)", () => {
		const content = `digraph {
	music_bus [label="Which music would you like to listen to on the bus?"]
	breakfast [label="What breakfast do you want to eat?"]
	sell_game [label="Do you want to program bandersnatch at the company?"]

	music_bus -> breakfast -> [color=gray]
}`;
		const requestOffset = getRequestOffset(content, "breakfast ->");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(3); // music_bus, breakfast, sell_game
	});

	it("should provide completion for nodes (trailing space; between nodes, issue #17 2)", () => {
		const content = `digraph {
	music_bus [label="Which music would you like to listen to on the bus?"]
	breakfast [label="What breakfast do you want to eat?"]
	sell_game [label="Do you want to program bandersnatch at the company?"]

	music_bus -> breakfast ->  [color=gray]
}`;
		const requestOffset = getRequestOffset(content, "breakfast ->");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(3); // music_bus, breakfast, sell_game
	});

	it("should provide completion for nodes (trailing space; between nodes, issue #17 3)", () => {
		const content = `digraph {
	music_bus [label="Which music would you like to listen to on the bus?"]
	breakfast [label="What breakfast do you want to eat?"]
	sell_game [label="Do you want to program bandersnatch at the company?"]

	music_bus -> breakfast ->[color=gray]
}`;
		const requestOffset = getRequestOffset(content, "breakfast ->");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(3); // music_bus, breakfast, sell_game
	});

	it("should provide completion for nodes (trailing space; between nodes, issue #17 4)", () => {
		const content = `digraph {
	music_bus [label="Which music would you like to listen to on the bus?"]
	breakfast [label="What breakfast do you want to eat?"]
	sell_game [label="Do you want to program bandersnatch at the company?"]

	music_bus -> breakfast ->[color=gray,]
}`;
		const requestOffset = getRequestOffset(content, "color=gray,");

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).to.exist;
		if (!completions) throw "Just for the type checker";

		expect(completions).to.have.length(170); // music_bus, breakfast, sell_game
	});
});
