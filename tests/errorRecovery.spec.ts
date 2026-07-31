import { describe, test } from "node:test";
import { expect } from "expect";

import { createParserWithText, ensureDocAndSourceFile, ensureGraph } from "./testUtils.ts";
import { skipTrivia } from "../src/scanner.ts";
import { hover } from "../src/service/hover.ts";
import { syntaxKind } from "../src/types.ts";

void describe("Error Recovery", () => {
	void describe("attribute statement without attribute list", () => {
		for (const keyword of ["graph", "node", "edge"]) {
			void test(`"${keyword}" without "[" does not crash binding`, () => {
				const [, sf] = ensureDocAndSourceFile(`graph { ${keyword} }`);

				const g = ensureGraph(sf);
				expect(g.statements).toHaveLength(1);

				const statement = g.statements[0];
				expect(statement).toMatchObject({ kind: syntaxKind.AttributeStatement });
				expect(sf.diagnostics.length).toBeGreaterThan(0);
			});
		}

		void test("attributes are an empty list instead of undefined", () => {
			const sf = createParserWithText("graph { edge }");
			const g = ensureGraph(sf);

			const statement = g.statements[0];
			expect(statement.kind).toBe(syntaxKind.AttributeStatement);
			expect((statement as { attributes: unknown }).attributes).toHaveLength(0);
		});

		void test("terminator is still parsed", () => {
			const sf = createParserWithText("graph { node; }");
			const g = ensureGraph(sf);

			expect(g.statements[0]).toMatchObject({
				kind: syntaxKind.AttributeStatement,
				terminator: expect.objectContaining({ kind: syntaxKind.SemicolonToken }),
			});
		});
	});

	void describe("carriage returns", () => {
		void test("skipTrivia terminates on a lone CR", () => {
			expect(skipTrivia("a\rb", 1)).toBe(2);
		});

		void test("skipTrivia handles CRLF, lone CR and mixed runs", () => {
			expect(skipTrivia("a\r\nb", 1)).toBe(3);
			expect(skipTrivia("a\r\r\rb", 1)).toBe(4);
			expect(skipTrivia("a\r \r\n\tb", 1)).toBe(6);
			expect(skipTrivia("a\r", 1)).toBe(2);
		});

		void test("hover on a document with CR line endings terminates", () => {
			const content = "graph {\ra -- b\r}";
			const [doc, sf] = ensureDocAndSourceFile(content);

			const g = ensureGraph(sf);
			expect(g.statements).toHaveLength(1);

			// getStart() -> skipTrivia() used to loop forever on the lone CR in front of "a"
			const h = hover(doc, sf, doc.positionAt(content.indexOf("a --")));
			expect(h?.contents).toBe("(node) a");
		});
	});
});
