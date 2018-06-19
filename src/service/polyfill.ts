import * as lst from "vscode-languageserver-types";

/**
 * Represents a color range from a document.
 */
export interface ColorInformation {
	/**
	 * The range in the document where this color appers.
	 */
	range: lst.Range;
	/**
	 * The actual color value for this color range.
	 */
	color: Color;
}
/**
 * Represents a color in RGBA space.
 */
export interface Color {
	/**
	 * The red component of this color in the range [0-1].
	 */
	readonly red: number;
	/**
	 * The green component of this color in the range [0-1].
	 */
	readonly green: number;
	/**
	 * The blue component of this color in the range [0-1].
	 */
	readonly blue: number;
	/**
	 * The alpha component of this color in the range [0-1].
	 */
	readonly alpha: number;
}
