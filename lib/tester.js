"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const binder_1 = require("./binder");
const checker_1 = require("./checker");
const text = `# http://www.graphviz.org/content/cluster

digraph G {

	subgraph cluster_0 {
		style=filled;
		color=lightgrey;
		node [style=filled,color=white];
		a0 -> a1 -> a2 -> a3;
		label = "process #1";
		label = a
	}

	subgraph cluster_1 {
		node [style=filled];
		b0 -> b1 -> b2 -> b3;
		label = "process #2";
		color=blue
	}
	start -> a0;
	start -> b0;
	a1 -> b3;
	b2 -> a3;
	a3 -> a0;
	a3 -> end;
	b3 -> end;

	start [shape=Mdiamond];
	end [shape=Msquare];
}
`;
function main() {
    const parser = new parser_1.Parser();
    const source = parser.parse(text);
    binder_1.bindSourceFile(source);
    checker_1.checkSourceFile(source);
    console.dir(source);
}
main();
//# sourceMappingURL=tester.js.map