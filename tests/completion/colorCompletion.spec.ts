import { ensureDocAndSourceFile, getLabel, assertExists } from "../testutils.js";
import { getCompletions } from "../../src/service/completion.js";
import { colors } from "../../src/service/languageFacts.js";

const allColors = Object.keys(colors);

describe("Color completion", () => {

	it("should provide completion for colors (trailing attribute)", () => {
		const content = `graph {
			a -- b [color=];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(allColors);
		expect(completions).toHaveLength(allColors.length);
	});

	it("should provide completion for colors (leading attribute)", () => {
		const content = `graph {
			a -- b [color=,shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(allColors);
		expect(completions).toHaveLength(allColors.length);
	});

	it("should provide completion for colors (center attribute)", () => {
		const content = `graph {
			a -- b [label="hi!",color=,shape=box];
		}`;
		const requestOffset = content.indexOf("color=") + "color=".length;

		const [doc, sf] = ensureDocAndSourceFile(content);

		const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

		expect(completions).toBeDefined();
		assertExists(completions);

		expect(completions.length).toBeGreaterThan(0);
		expect(completions.map(getLabel)).toEqual(allColors);
		expect(completions).toHaveLength(allColors.length);
	});

	it(
        "should provide completion for colors (center attribute with spaces)",
        () => {
            const content = `graph {
                a -- b [label="hi!" , color=,  shape=box];
            }`;
            const requestOffset = content.indexOf("color=") + "color=".length;

            const [doc, sf] = ensureDocAndSourceFile(content);

            const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

            expect(completions).toBeDefined();
            assertExists(completions);

            expect(completions.length).toBeGreaterThan(0);
            expect(completions.map(getLabel)).toEqual(allColors);
            expect(completions).toHaveLength(allColors.length);
        }
    );

	it(
        "should provide completion for colors (center attribute with spaces and semicolons)",
        () => {
            const content = `graph {
                a -- b [label="hi!" ; color=;  shape=box];
            }`;
            const requestOffset = content.indexOf("color=") + "color=".length;

            const [doc, sf] = ensureDocAndSourceFile(content);

            const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

            expect(completions).toBeDefined();
            assertExists(completions);

            expect(completions.length).toBeGreaterThan(0);
            expect(completions.map(getLabel)).toEqual(allColors);
            expect(completions).toHaveLength(allColors.length);
        }
    );

	it(
        "should provide completion for colors (center attribute mixed spaces and separators)",
        () => {
            const content = `graph {
                a -- b [label="hi!" ,color=;
                 shape=box];
            }`;
            const requestOffset = content.indexOf("color=") + "color=".length;

            const [doc, sf] = ensureDocAndSourceFile(content);

            const completions = getCompletions(doc, sf, doc.positionAt(requestOffset));

            expect(completions).toBeDefined();
            assertExists(completions);

            expect(completions.length).toBeGreaterThan(0);
            expect(completions.map(getLabel)).toEqual(allColors);
            expect(completions).toHaveLength(allColors.length);
        }
    );
});
