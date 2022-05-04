import { Parser } from "./parser";
import { bindSourceFile } from "./binder";
import { checkSourceFile } from "./checker";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getCompletions } from "./service/completion";
// import { Scanner, DefaultScanner } from "./scanner";
// import { hover } from "./service/hover";

const text = `graph {
	node_name_a -- node_name_b [color=blue,
	];
}`;

function main() {
	const parser = new Parser();
	const sf = parser.parse(text);
	bindSourceFile(sf);
	checkSourceFile(sf);
	const doc = TextDocument.create("inmemory://model.json", "DOT", 0, text);

/*
	const h = hover(doc, sf, doc.positionAt(15));
	console.dir(h);
*/

	const requestOffset = text.indexOf("color=blue,\n\t") + "color=blue,\n\t".length;

	const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

	console.dir(completions);

}

main();
