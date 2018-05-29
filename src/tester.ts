import { Scanner, DefaultScanner } from "./scanner";
import { Parser } from "./parser";
import { bindSourceFile } from "./binder";
import { checkSourceFile } from "./checker";

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
	const parser = new Parser();
	const source = parser.parse(text);
	bindSourceFile(source);
	checkSourceFile(source);
	console.dir(source);
}

main();
