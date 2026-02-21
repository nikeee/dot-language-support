import { expect } from "expect";
import { TextDocument } from "vscode-languageserver-textdocument";

import { Parser } from "../src/index.ts";
import type { SourceFile, Graph } from "../src/types.ts";
import { bindSourceFile } from "../src/binder.ts";
import { checkSourceFile } from "../src/checker.ts";

export function createParserWithText(text: string, bind = false) {
	const p = new Parser();
	const result = p.parse(text);
	if (bind) {
		bindSourceFile(result);
	}
	return result;
}

export function ensureGraph(sourceFile: SourceFile): Graph {
	expect(sourceFile).toBeDefined();
	expect(sourceFile.graph).toBeDefined();

	const g = sourceFile.graph;
	if (g === undefined) throw "Graph was undefined";
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
