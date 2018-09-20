import { Scanner, DefaultScanner } from "./scanner";
import { Parser } from "./parser";
import { bindSourceFile } from "./binder";
import { checkSourceFile } from "./checker";
import { TextDocument } from "vscode-languageserver-types/lib/umd/main";
import { getCompletions } from "./service/completion";
import { hover } from "./service/hover";

const text = `graph{subgraph{c--a;c--b}}`;

function main() {
	const parser = new Parser();
	const sf = parser.parse(text);
	bindSourceFile(sf);
	checkSourceFile(sf);
	const doc = TextDocument.create("inmemory://model.json", "DOT", 0, text);

	const h = hover(doc, sf, doc.positionAt(15));
	console.dir(h);

/*
	const requestOffset = text.indexOf("color=") + "color=".length;

	const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

	console.dir(completions);
*/
}

main();
