import { DefaultScanner, Parser } from "../src"
import { SourceFile, Graph } from "../src/types";
import { expect } from "chai";
import { TextDocument } from "vscode-languageserver-types/lib/umd/main";
import { bindSourceFile } from "../src/binder";
import { checkSourceFile } from "../src/checker";

export function createParserWithText(text: string) {
	const p = new Parser();
	return p.parse(text);
}

export function ensureGraph(sourceFile: SourceFile): Graph {
	expect(sourceFile).to.exist;
	expect(sourceFile.graph).to.exist;

	const g = sourceFile.graph;
	if (g === undefined)
		throw "Graph was undefined";
	return g;
}

export function ensureDocAndSourceFile(text: string): [TextDocument, SourceFile]{
	const doc = TextDocument.create("inmemory://model.json", "DOT", 0, text);
	const p = createParserWithText(doc.getText());
	bindSourceFile(p);
	checkSourceFile(p);
	return [doc, p];
}
