import { TextDocument } from "vscode-languageserver-textdocument";

import { Parser } from "../src"
import { SourceFile, Graph } from "../src/types";
import { bindSourceFile } from "../src/binder";
import { checkSourceFile } from "../src/checker";

export function createParserWithText(text: string) {
	const p = new Parser();
	return p.parse(text);
}

export function ensureGraph(sourceFile: SourceFile): Graph {
	expect(sourceFile).toBeDefined();
	expect(sourceFile.graph).toBeDefined();

	const g = sourceFile.graph;
	if (g === undefined)
		throw "Graph was undefined";
	return g;
}

export function ensureDocAndSourceFile(text: string): [TextDocument, SourceFile] {
	const doc = TextDocument.create("inmemory://model.json", "DOT", 0, text);
	const p = createParserWithText(doc.getText());
	bindSourceFile(p);
	checkSourceFile(p);
	return [doc, p];
}

export function getLabel(c: { label: string }): string {
	return c.label;
}

export function getRequestOffset(content: string, uniqueNeedle: string): number {
	return content.indexOf(uniqueNeedle) + uniqueNeedle.length;
}

export function assertExists(a: unknown): asserts a is object | string | number | boolean | symbol {
	if (!a)
		throw new Error("Just for the type checker, chai lacks the ability to type this.");
}
