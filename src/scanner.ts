import { createMapFromTemplate } from "./core.ts";
import { assertNever } from "./service/util.ts";
import {
	characterCodes,
	type DiagnosticCategory,
	diagnosticCategory,
	type ScanError,
	type SyntaxKind,
	scanError,
	syntaxKind,
	type TokenFlags,
	tokenFlags,
} from "./types.ts";

export interface Scanner {
	readonly end: number;
	readonly pos: number;
	readonly startPos: number;
	readonly tokenPos: number;
	readonly token: SyntaxKind;
	readonly tokenValue: string | undefined;
	readonly isUnterminated: boolean;
	readonly text: string;
	readonly onError: ErrorCallback | null;

	setText(newText?: string, start?: number, length?: number): void;
	setErrorCallback(cb: ErrorCallback): void;
	scan(skipTrivia: boolean): SyntaxKind;
	lookAhead(callback: () => SyntaxKind | boolean): SyntaxKind | boolean;
	tryScan(callback: () => SyntaxKind | boolean): SyntaxKind | boolean;
}

const textToToken = createMapFromTemplate({
	digraph: syntaxKind.DigraphKeyword,
	graph: syntaxKind.GraphKeyword,
	edge: syntaxKind.EdgeKeyword,
	node: syntaxKind.NodeKeyword,
	strict: syntaxKind.StrictKeyword,
	subgraph: syntaxKind.SubgraphKeyword,

	n: syntaxKind.CompassNorthToken,
	ne: syntaxKind.CompassNorthEastToken,
	e: syntaxKind.CompassEastToken,
	se: syntaxKind.CompassSouthEastToken,
	s: syntaxKind.CompassSouthToken,
	sw: syntaxKind.CompassSouthWestToken,
	w: syntaxKind.CompassWestToken,
	nw: syntaxKind.CompassNorthWestToken,
	c: syntaxKind.CompassCenterToken,

	"+": syntaxKind.PlusToken,
	"=": syntaxKind.EqualsToken,
	"->": syntaxKind.DirectedEdgeOp,
	"--": syntaxKind.UndirectedEdgeOp,
	"{": syntaxKind.OpenBraceToken,
	"}": syntaxKind.CloseBraceToken,
	"[": syntaxKind.OpenBracketToken,
	"]": syntaxKind.CloseBracketToken,
	";": syntaxKind.SemicolonToken,
	":": syntaxKind.ColonToken,
	_: syntaxKind.UnderscoreToken,
	",": syntaxKind.CommaToken,
	"<": syntaxKind.LessThan,
	">": syntaxKind.GreaterThan,
});

// TODO: Move to utils
function makeReverseMap(source: Map<string, SyntaxKind>): Map<SyntaxKind, string> {
	const result = new Map<SyntaxKind, string>();
	source.forEach((value, key) => {
		result.set(value, key);
	});
	return result;
}

const tokenToText = makeReverseMap(textToToken);

export function getTokenAsText(token: SyntaxKind): string | undefined {
	return tokenToText.get(token);
}
export function getTextAsToken(token: string): SyntaxKind | undefined {
	return textToToken.get(token);
}

export type ErrorCallback = (
	message: string,
	category: DiagnosticCategory,
	sub: ScanError,
	length: number,
) => void;

export class DefaultScanner implements Scanner {
	end: number;
	pos: number;
	startPos: number;
	tokenPos: number;
	token: SyntaxKind;
	tokenValue: string | undefined;
	tokenFlags: TokenFlags;
	isUnterminated: boolean;
	text: string;
	onError: ErrorCallback | null;

	setText(newText?: string, start = 0, length?: number): void {
		this.text = newText || "";
		this.end = length === undefined ? this.text.length : start + length;
		this.#setTextPos(start || 0);
	}

	setErrorCallback(cb: ErrorCallback | null) {
		this.onError = cb;
	}

	#setTextPos(textPos: number) {
		console.assert(textPos >= 0);
		this.pos = textPos;
		this.startPos = textPos;
		this.tokenPos = textPos;
		this.token = syntaxKind.Unknown;
		this.tokenValue = undefined;
		this.tokenFlags = tokenFlags.None;
	}

	scan(skipTrivia = true): SyntaxKind {
		this.startPos = this.pos;
		this.tokenFlags = tokenFlags.None;
		this.isUnterminated = false;

		while (true) {
			this.tokenPos = this.pos;
			if (this.pos >= this.end) {
				return (this.token = syntaxKind.EndOfFileToken);
			}

			let ch = this.text.charCodeAt(this.pos);
			switch (ch) {
				case characterCodes.lineFeed:
				case characterCodes.carriageReturn:
					this.tokenFlags |= tokenFlags.PrecedingLineBreak;
					// Maybe add flags to token
					if (skipTrivia) {
						this.pos++;
						continue;
					}
					// consume both CR and LF
					if (
						ch === characterCodes.carriageReturn &&
						this.pos + 1 < this.end &&
						this.text.charCodeAt(this.pos + 1) === characterCodes.lineFeed
					) {
						this.pos += 2;
					} else {
						this.pos++;
					}
					return (this.token = syntaxKind.NewLineTrivia);
				case characterCodes.tab:
				case characterCodes.verticalTab:
				case characterCodes.formFeed:
				case characterCodes.space:
					if (skipTrivia) {
						this.pos++;
						continue;
					}
					while (
						this.pos < this.end &&
						this.#isWhiteSpaceSingleLine(this.text.charCodeAt(this.pos))
					)
						this.pos++;
					return (this.token = syntaxKind.WhitespaceTrivia);

				case characterCodes.hash: {
					const content = this.#scanHashCommentTrivia(skipTrivia);

					// Skip rest of line
					if (skipTrivia) continue;
					this.tokenValue = content;
					return (this.token = syntaxKind.HashCommentTrivia);
				}
				case characterCodes.slash: {
					if (this.pos + 1 < this.end) {
						const nextChar = this.text.charCodeAt(this.pos + 1);

						switch (nextChar) {
							case characterCodes.slash: {
								const commentContent =
									this.#scanSingleLineCommentTrivia(skipTrivia);
								if (skipTrivia) continue;

								this.tokenValue = commentContent;
								return (this.token = syntaxKind.SingleLineCommentTrivia);
							}
							case characterCodes.asterisk: {
								const commentContent = this.#scanMultiLineCommentTrivia(skipTrivia);
								if (skipTrivia) continue;

								this.tokenValue = commentContent;
								return (this.token = syntaxKind.MultiLineCommentTrivia);
							}
						}
					}
					this.#error(
						'Unexpected "/". Did you mean to start a comment like "/*" or "//"? If you wanted to use it as an identifier, put it in double quotes.',
						scanError.ExpectationFailed,
					);
					++this.pos;
					break;
				}
				case characterCodes.openBrace:
					this.pos++;
					return (this.token = syntaxKind.OpenBraceToken);
				case characterCodes.closeBrace:
					this.pos++;
					return (this.token = syntaxKind.CloseBraceToken);
				case characterCodes.openBracket:
					this.pos++;
					return (this.token = syntaxKind.OpenBracketToken);
				case characterCodes.closeBracket:
					this.pos++;
					return (this.token = syntaxKind.CloseBracketToken);
				case characterCodes.plus:
					this.pos++;
					return (this.token = syntaxKind.PlusToken);
				case characterCodes.equals:
					this.pos++;
					return (this.token = syntaxKind.EqualsToken);
				case characterCodes._0:
				case characterCodes._1:
				case characterCodes._2:
				case characterCodes._3:
				case characterCodes._4:
				case characterCodes._5:
				case characterCodes._6:
				case characterCodes._7:
				case characterCodes._8:
				case characterCodes._9:
				case characterCodes.dot:
					this.tokenValue = this.#scanNumber();
					return (this.token = syntaxKind.NumericIdentifier);
				case characterCodes.minus: {
					const nextChar = this.text.charCodeAt(this.pos + 1);

					switch (nextChar) {
						case characterCodes.minus: // --
							this.pos += 2;
							return (this.token = syntaxKind.UndirectedEdgeOp);
						case characterCodes.greaterThan: // ->
							this.pos += 2;
							return (this.token = syntaxKind.DirectedEdgeOp);

						case characterCodes._0:
						case characterCodes._1:
						case characterCodes._2:
						case characterCodes._3:
						case characterCodes._4:
						case characterCodes._5:
						case characterCodes._6:
						case characterCodes._7:
						case characterCodes._8:
						case characterCodes._9:
						case characterCodes.dot:
							this.tokenValue = this.#scanNumber();
							return (this.token = syntaxKind.NumericIdentifier);
						default: {
							const chr = this.text.charAt(this.pos + 1);
							this.#error(
								`Unexpected "${chr}". Did you mean to define an edge? Depending on the type of graph you are defining, use "->" or "--".`,
								scanError.ExpectationFailed,
							);
							break;
						}
					}
					this.pos++;
					break;
					// debugger;
					//return this.token = syntaxKind.Unknown;
				}
				// TODO: Remove UnderscoreToken
				case characterCodes._:
					this.pos++;
					return (this.token = syntaxKind.UnderscoreToken);
				case characterCodes.semicolon:
					this.pos++;
					return (this.token = syntaxKind.SemicolonToken);
				case characterCodes.colon:
					this.pos++;
					return (this.token = syntaxKind.ColonToken);
				case characterCodes.comma:
					this.pos++;
					return (this.token = syntaxKind.CommaToken);
				case characterCodes.lessThan:
					this.tokenValue = this.#scanHtml();
					return (this.token = syntaxKind.HtmlIdentifier);
				case characterCodes.doubleQuote:
					this.tokenValue = this.#scanString();
					return (this.token = syntaxKind.StringLiteral);
				default: {
					if (isIdentifierStart(ch)) {
						this.pos++;
						while (
							this.pos < this.end &&
							isIdentifierPart((ch = this.text.charCodeAt(this.pos)))
						)
							this.pos++;

						const value = this.text.substring(this.tokenPos, this.pos);
						this.tokenValue = value;
						return (this.token = this.#getIdentifierToken(value));
					}
					if (this.#isWhiteSpaceSingleLine(ch)) {
						this.pos++;
						continue;
					}

					const chr = this.text.charAt(this.pos);
					this.#error(
						`Unexpected "${chr}". Did you mean to start an identifier? Node names cannot start with "${chr}".`,
						scanError.ExpectationFailed,
					);
					// debugger;
					this.pos++;
					break;
					// return this.token = syntaxKind.Unknown;
				}
			}
		}
	}

	#error(
		message: string,
		sub: ScanError,
		category: DiagnosticCategory = diagnosticCategory.Error,
		errPos: number = this.pos,
		length = 0,
	): void {
		const cb = this.onError;
		if (cb) {
			const posSave = this.pos;
			// set current pos to errorPos to be able to get it via scanner.pos correctly
			this.pos = errPos;
			cb(message, category, sub, length);
			this.pos = posSave;
		}
	}

	#isWhiteSpaceSingleLine(ch: number) {
		// Note: nextLine is in the Zs space, and should be considered to be a whitespace.
		// It is explicitly not a line-break as it isn't in the exact set specified by EcmaScript.
		return (
			ch === characterCodes.space ||
			ch === characterCodes.tab ||
			ch === characterCodes.verticalTab ||
			ch === characterCodes.formFeed ||
			ch === characterCodes.nonBreakingSpace ||
			ch === characterCodes.nextLine ||
			ch === characterCodes.ogham ||
			(ch >= characterCodes.enQuad && ch <= characterCodes.zeroWidthSpace) ||
			ch === characterCodes.narrowNoBreakSpace ||
			ch === characterCodes.mathematicalSpace ||
			ch === characterCodes.ideographicSpace ||
			ch === characterCodes.byteOrderMark
		);
	}

	#isAtMultiLineCommentEnd(pos: number): boolean {
		return (
			pos + 1 < this.end &&
			this.text.charCodeAt(pos) === characterCodes.asterisk &&
			this.text.charCodeAt(pos + 1) === characterCodes.slash
		);
	}

	#scanHashCommentTrivia(skip: boolean): string | undefined {
		++this.pos;
		const start = this.pos;
		while (this.pos < this.end && !isLineBreak(this.text.charCodeAt(this.pos))) this.pos++;

		// line breaks are consumed by the scanner, so we need to handle the comment trailing

		return skip ? undefined : this.text.substring(start, this.pos);
	}

	#scanSingleLineCommentTrivia(skip: boolean): string | undefined {
		this.pos += 2;
		const start = this.pos;
		while (this.pos < this.end && !isLineBreak(this.text.charCodeAt(this.pos))) this.pos++;

		// line breaks are consumed by the scanner, so we need to handle the comment trailing

		return skip ? undefined : this.text.substring(start, this.pos);
	}

	#scanMultiLineCommentTrivia(skip: boolean): string | undefined {
		this.pos += 2;
		const start = this.pos;
		while (this.pos < this.end && !this.#isAtMultiLineCommentEnd(this.pos)) this.pos++;

		const commentEnd = this.pos;
		if (this.#isAtMultiLineCommentEnd(this.pos)) {
			this.pos += 2;
		}

		return skip ? undefined : this.text.substring(start, commentEnd);
	}

	#scanHtml(): string {
		// const htmlOpen = this.text.charCodeAt(this.pos);
		this.pos++;
		let result = "";
		const start = this.pos;

		let subTagsLevel = 0;
		while (true) {
			if (this.pos >= this.end) {
				result += this.text.substring(start, this.pos);
				this.tokenFlags |= tokenFlags.Unterminated;
				this.isUnterminated = true;
				this.#error("Unterminated html literal", scanError.Unterminated);
				break;
			}
			const ch = this.text.charCodeAt(this.pos);
			if (ch === characterCodes.lessThan) {
				++subTagsLevel;
				this.pos++;
				continue;
			}
			if (ch === characterCodes.greaterThan) {
				this.pos++;
				console.assert(subTagsLevel >= 0);

				if (subTagsLevel === 0) {
					result += this.text.substring(start, this.pos);
					break;
				}
				--subTagsLevel;
				continue;
			}
			this.pos++;
		}
		return result;
	}

	// biome-ignore lint/correctness/noUnusedFunctionParameters: todo
	#scanString(allowEscapes = true): string {
		const quote = this.text.charCodeAt(this.pos);
		this.pos++;
		let result = "";
		const start = this.pos;
		let hasBackslash = false;
		while (true) {
			if (this.pos >= this.end) {
				result += this.text.substring(start, this.pos);
				this.tokenFlags |= tokenFlags.Unterminated;
				this.isUnterminated = true;
				this.#error("Unterminated string", scanError.Unterminated);
				break;
			}
			const ch = this.text.charCodeAt(this.pos);

			if (ch === characterCodes.backslash) {
				hasBackslash = true;
			} else {
				if (hasBackslash) {
					hasBackslash = false;
				} else {
					if (ch === quote) {
						result += this.text.substring(start, this.pos);
						this.pos++;
						break;
					}
					if (isLineBreak(ch)) {
						result += this.text.substring(start, this.pos);
						this.tokenFlags |= tokenFlags.Unterminated;
						this.isUnterminated = true;
						this.#error("Unterminated string", scanError.Unterminated);
						break;
					}
				}
			}

			this.pos++;
		}
		const removedEscapes = result.replace(/\\"/g, '"').replace(/\\(\r?\n)/g, "$1");
		return removedEscapes;
	}

	#scanNumber(): string {
		let result = "";
		let hadDot = false;
		let hadMinus = false;
		const start = this.pos;
		while (true) {
			const ch = this.text.charCodeAt(this.pos);

			switch (ch) {
				case characterCodes._0:
				case characterCodes._1:
				case characterCodes._2:
				case characterCodes._3:
				case characterCodes._4:
				case characterCodes._5:
				case characterCodes._6:
				case characterCodes._7:
				case characterCodes._8:
				case characterCodes._9:
					break;
				case characterCodes.dot:
					if (hadDot) {
						result += this.text.substring(start, this.pos);
						return result;
					}
					hadDot = true;
					hadMinus = true;
					break;
				case characterCodes.minus:
					if (this.pos !== start || hadMinus) {
						result += this.text.substring(start, this.pos);
						return result;
					}
					hadMinus = true;
					break;
				default:
					result += this.text.substring(start, this.pos);
					return result;
			}
			++this.pos;
		}
	}

	#getIdentifierToken(tokenValue: string): SyntaxKind {
		// Reserved words are between 4 and 8 characters long and are case insensitive
		const len = tokenValue.length;
		if (len >= 4 && len <= 8) {
			const ch = tokenValue.charCodeAt(0);
			if (
				(ch >= characterCodes.a && ch <= characterCodes.z) ||
				(ch >= characterCodes.A && ch <= characterCodes.Z)
			) {
				const lowerCaseToken = tokenValue.toLowerCase();
				const t = textToToken.get(lowerCaseToken);
				if (t !== undefined) {
					this.token = t;
					return t;
				}
			}
		}
		return (this.token = syntaxKind.TextIdentifier);
	}

	lookAhead<T extends SyntaxKind>(callback: () => T): T {
		return this.#speculationHelper(callback, /*isLookahead*/ true);
	}

	tryScan<T extends SyntaxKind>(callback: () => T): T {
		return this.#speculationHelper(callback, /*isLookahead*/ false);
	}

	#speculationHelper<T>(callback: () => T, isLookahead: boolean): T {
		const savePos = this.pos;
		const saveStartPos = this.startPos;
		const saveTokenPos = this.tokenPos;
		const saveToken = this.token;
		const saveTokenValue = this.tokenValue;
		const saveTokenFlags = this.tokenFlags;

		const result = callback();

		// If our callback returned something 'falsy' or we're just looking ahead,
		// then unconditionally restore us to where we were.
		if (!result || isLookahead) {
			this.pos = savePos;
			this.startPos = saveStartPos;
			this.tokenPos = saveTokenPos;
			this.token = saveToken;
			this.tokenValue = saveTokenValue;
			this.tokenFlags = saveTokenFlags;
		}
		return result;
	}
}

type Identifier =
	| typeof syntaxKind.HtmlIdentifier
	| typeof syntaxKind.TextIdentifier
	| typeof syntaxKind.StringLiteral
	| typeof syntaxKind.NumericIdentifier;

// TODO: Clean this up
/**
 * An ID is one of the following:
 * - Any string of alphabetic ([a-zA-Z\200-\377]) characters, underscores ('_') or digits ([0-9]), not beginning with a digit;
 * - a numeral [-]?(.[0-9]+ | [0-9]+(.[0-9]*)? );
 * - any double-quoted string ("...") possibly containing escaped quotes (\");
 * - an HTML string (<...>).
 */
// biome-ignore lint/correctness/noUnusedVariables: todo
function isIdentifierPartOf(ch: number, idType: Identifier): boolean {
	switch (idType) {
		case syntaxKind.TextIdentifier:
			return (
				ch === characterCodes._ ||
				(characterCodes.A <= ch && ch <= characterCodes.Z) ||
				(characterCodes.a <= ch && ch <= characterCodes.z) ||
				(characterCodes._0 <= ch && ch <= characterCodes._9)
			);
		case syntaxKind.HtmlIdentifier:
			// TODO: This may not be all char codes
			return (
				ch === characterCodes._ ||
				ch === characterCodes.lessThan ||
				ch === characterCodes.equals ||
				ch === characterCodes.doubleQuote ||
				(characterCodes.A <= ch && ch <= characterCodes.Z) ||
				(characterCodes.a <= ch && ch <= characterCodes.z) ||
				(characterCodes._0 <= ch && ch <= characterCodes._9)
			);
		case syntaxKind.StringLiteral:
			// TODO: This may not be all char codes
			return (
				ch === characterCodes._ ||
				ch === characterCodes.backslash ||
				ch === characterCodes.lessThan ||
				ch === characterCodes.equals ||
				ch === characterCodes.doubleQuote ||
				(characterCodes.A <= ch && ch <= characterCodes.Z) ||
				(characterCodes.a <= ch && ch <= characterCodes.z) ||
				(characterCodes._0 <= ch && ch <= characterCodes._9)
			);
		case syntaxKind.NumericIdentifier:
			return (
				ch === characterCodes.minus ||
				ch === characterCodes.dot ||
				(characterCodes._0 <= ch && ch <= characterCodes._9)
			);
		default:
			return assertNever(idType);
	}
}

/**
 * HTML Identifier starts: '<'
 * quoted string starts: '"'
 * numeric identifier starts: '-', '.', '0' - '9'
 * string starts: 'a'-'z', 'A'-'Z', '_'
 */
// biome-ignore lint/correctness/noUnusedVariables: todo
function getIdentifierStart(ch: number): Identifier | undefined {
	if (ch === characterCodes.lessThan) return syntaxKind.HtmlIdentifier;
	if (ch === characterCodes.doubleQuote) return syntaxKind.StringLiteral;
	if (
		ch === characterCodes._ ||
		(characterCodes.A <= ch && ch <= characterCodes.Z) ||
		(characterCodes.a <= ch && ch <= characterCodes.z)
	)
		return syntaxKind.TextIdentifier;

	if (
		ch === characterCodes.minus ||
		ch === characterCodes.dot ||
		(characterCodes._0 <= ch && ch <= characterCodes._9)
	)
		return syntaxKind.NumericIdentifier;

	return undefined;
}

export function isIdentifierStart(ch: number): boolean {
	// TODO: Check Identifiers
	return (
		(ch >= characterCodes.A && ch <= characterCodes.Z) ||
		(ch >= characterCodes.a && ch <= characterCodes.z) ||
		(ch >= characterCodes._0 && ch <= characterCodes._9) ||
		ch === characterCodes._ ||
		ch === characterCodes.lessThan ||
		ch === characterCodes.doubleQuote
	);
}

function isIdentifierPart(ch: number): boolean {
	return (
		(ch >= characterCodes.A && ch <= characterCodes.Z) ||
		(ch >= characterCodes.a && ch <= characterCodes.z) ||
		(ch >= characterCodes._0 && ch <= characterCodes._9) ||
		ch === characterCodes.$ ||
		ch === characterCodes._ ||
		ch > characterCodes.maxAsciiCharacter
	);
}

export function skipTrivia(text: string, pos: number /* stopAtComments = false */): number {
	// When changed, also change the implementation in the scanner
	while (true) {
		const ch = text.charCodeAt(pos);
		switch (ch) {
			case characterCodes.carriageReturn:
				if (text.charCodeAt(pos + 1) === characterCodes.lineFeed) ++pos;
				continue;
			case characterCodes.lineFeed:
			case characterCodes.tab:
			case characterCodes.verticalTab:
			case characterCodes.formFeed:
			case characterCodes.space:
				++pos;
				continue;
			case characterCodes.hash: {
				// Skip single line comments started using hash
				++pos;
				while (pos < text.length) {
					if (isLineBreak(text.charCodeAt(pos))) break;
					++pos;
				}
				continue;
			}
			case characterCodes.slash:
				if (pos + 1 < text.length) {
					const nextChar = text.charCodeAt(pos + 1);

					switch (nextChar) {
						case characterCodes.slash: {
							pos += 2;
							while (pos < text.length) {
								if (isLineBreak(text.charCodeAt(pos))) break;
								++pos;
							}
							continue;
						}
						case characterCodes.asterisk: {
							pos += 2;
							while (pos < text.length) {
								if (
									text.charCodeAt(pos) === characterCodes.asterisk &&
									text.charCodeAt(pos + 1) === characterCodes.slash
								) {
									pos += 2;
									break;
								}
								++pos;
							}
							continue;
						}
					}
				}
				break;
		}
		return pos;
	}
}

export function isLineBreak(ch: number): boolean {
	return ch === characterCodes.lineFeed || ch === characterCodes.carriageReturn;
}
