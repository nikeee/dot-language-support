import { DefaultScanner, Parser } from "../src"
import { SourceFile, Graph } from "../src/types";
import { expect } from "chai";

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
