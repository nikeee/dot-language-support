import type {
	Color,
	ColorInformation,
	ColorPresentation,
	Range,
} from "vscode-languageserver-types";
import type { DocumentLike } from "../index.js";
import type { ColorTable, SourceFile } from "../types.js";
import * as languageFacts from "./languageFacts.js";
import { syntaxNodeToRange } from "./util.js";

const colorMap = languageFacts.colors as { [i: string]: string | undefined };

export function getDocumentColors(
	doc: DocumentLike,
	sourceFile: SourceFile,
): ColorInformation[] | undefined {
	const cs = sourceFile.colors;
	return cs ? colorTableToColorInformation(doc, sourceFile, cs) : undefined;
}

export function getColorRepresentations(
	_doc: DocumentLike,
	_sourceFile: SourceFile,
	color: Color,
	range: Range,
): ColorPresentation[] | undefined {
	return !color || !range ? undefined : [{ label: `"${getColorStringFromColor(color)}"` }];
}

function colorTableToColorInformation(
	doc: DocumentLike,
	sf: SourceFile,
	colors: ColorTable,
): ColorInformation[] {
	if (!colors || colors.size === 0) return [];

	const res = [];
	for (const [name, value] of colors) {
		if (!name || !value) continue;

		const color = getColorFromName(name);
		if (color) {
			res.push({
				range: syntaxNodeToRange(doc, sf, value.node),
				color,
			});
		}
	}

	return res;
}

function getColorFromName(name: string): ColorInformation["color"] | undefined {
	// If the user wrote "color=#123456", treat the name as a hex code
	if (name.charAt(0) === "#") return getHexCodeColor(name);

	// Otherwise, the name must be an alias defined in our color map
	const colorAlias = colorMap[name.toLowerCase()];
	return colorAlias ? getHexCodeColor(colorAlias) : undefined;
}

function getHexCodeColor(colorCode: string) {
	const hexCode = colorCode.charAt(0) === "#" ? colorCode.substring(1) : colorCode;

	const colorInt = Number.parseInt(hexCode, 16);
	return {
		red: ((colorInt >> 16) & 0xff) / 255.0,
		green: ((colorInt >> 8) & 0xff) / 255.0,
		blue: (colorInt & 0xff) / 255.0,
		alpha: hexCode.length === 8 ? ((colorInt >> 24) & 0xff) / 255.0 : 1.0,
	};
}

function getColorStringFromColor(c: Color): string {
	const red = (c.red * 255) | 0;
	const green = (c.green * 255) | 0;
	const blue = (c.blue * 255) | 0;
	// we ignore alpha here

	return `#${numberToPaddedString(red)}${numberToPaddedString(green)}${numberToPaddedString(
		blue,
	)}`;
}

function numberToPaddedString(n: number): string {
	const s = n.toString(16);
	return (s.length === 1 ? `0${s}` : s).toLowerCase();
}
