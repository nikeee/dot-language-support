import { createMapFromTemplate } from "./core.js";
import { assertNever } from "./service/util.js";
import {
	CharacterCodes,
	type DiagnosticCategory,
	diagnosticCategory,
	type ScanError,
	scanError,
	type SyntaxKind,
	syntaxKind,
	type TokenFlags,
	tokenFlags,
} from "./types.js";

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
				case CharacterCodes.lineFeed:
				case CharacterCodes.carriageReturn:
					this.tokenFlags |= tokenFlags.PrecedingLineBreak;
					// Maybe add flags to token
					if (skipTrivia) {
						this.pos++;
						continue;
					}
					// consume both CR and LF
					if (
						ch === CharacterCodes.carriageReturn &&
						this.pos + 1 < this.end &&
						this.text.charCodeAt(this.pos + 1) === CharacterCodes.lineFeed
					) {
						this.pos += 2;
					} else {
						this.pos++;
					}
					return (this.token = syntaxKind.NewLineTrivia);
				case CharacterCodes.tab:
				case CharacterCodes.verticalTab:
				case CharacterCodes.formFeed:
				case CharacterCodes.space:
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

				case CharacterCodes.hash: {
					const content = this.#scanHashCommentTrivia(skipTrivia);

					// Skip rest of line
					if (skipTrivia) continue;
					this.tokenValue = content;
					return (this.token = syntaxKind.HashCommentTrivia);
				}
				case CharacterCodes.slash: {
					if (this.pos + 1 < this.end) {
						const nextChar = this.text.charCodeAt(this.pos + 1);

						switch (nextChar) {
							case CharacterCodes.slash: {
								const commentContent =
									this.#scanSingleLineCommentTrivia(skipTrivia);
								if (skipTrivia) continue;

								this.tokenValue = commentContent;
								return (this.token = syntaxKind.SingleLineCommentTrivia);
							}
							case CharacterCodes.asterisk: {
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
				case CharacterCodes.openBrace:
					this.pos++;
					return (this.token = syntaxKind.OpenBraceToken);
				case CharacterCodes.closeBrace:
					this.pos++;
					return (this.token = syntaxKind.CloseBraceToken);
				case CharacterCodes.openBracket:
					this.pos++;
					return (this.token = syntaxKind.OpenBracketToken);
				case CharacterCodes.closeBracket:
					this.pos++;
					return (this.token = syntaxKind.CloseBracketToken);
				case CharacterCodes.plus:
					this.pos++;
					return (this.token = syntaxKind.PlusToken);
				case CharacterCodes.equals:
					this.pos++;
					return (this.token = syntaxKind.EqualsToken);
				case CharacterCodes._0:
				case CharacterCodes._1:
				case CharacterCodes._2:
				case CharacterCodes._3:
				case CharacterCodes._4:
				case CharacterCodes._5:
				case CharacterCodes._6:
				case CharacterCodes._7:
				case CharacterCodes._8:
				case CharacterCodes._9:
				case CharacterCodes.dot:
					this.tokenValue = this.#scanNumber();
					return (this.token = syntaxKind.NumericIdentifier);
				case CharacterCodes.minus: {
					const nextChar = this.text.charCodeAt(this.pos + 1);

					switch (nextChar) {
						case CharacterCodes.minus: // --
							this.pos += 2;
							return (this.token = syntaxKind.UndirectedEdgeOp);
						case CharacterCodes.greaterThan: // ->
							this.pos += 2;
							return (this.token = syntaxKind.DirectedEdgeOp);

						case CharacterCodes._0:
						case CharacterCodes._1:
						case CharacterCodes._2:
						case CharacterCodes._3:
						case CharacterCodes._4:
						case CharacterCodes._5:
						case CharacterCodes._6:
						case CharacterCodes._7:
						case CharacterCodes._8:
						case CharacterCodes._9:
						case CharacterCodes.dot:
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
				case CharacterCodes._:
					this.pos++;
					return (this.token = syntaxKind.UnderscoreToken);
				case CharacterCodes.semicolon:
					this.pos++;
					return (this.token = syntaxKind.SemicolonToken);
				case CharacterCodes.colon:
					this.pos++;
					return (this.token = syntaxKind.ColonToken);
				case CharacterCodes.comma:
					this.pos++;
					return (this.token = syntaxKind.CommaToken);
				case CharacterCodes.lessThan:
					this.tokenValue = this.#scanHtml();
					return (this.token = syntaxKind.HtmlIdentifier);
				case CharacterCodes.doubleQuote:
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

	#error(message: string, sub: ScanError, category?: DiagnosticCategory): void;
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
			ch === CharacterCodes.space ||
			ch === CharacterCodes.tab ||
			ch === CharacterCodes.verticalTab ||
			ch === CharacterCodes.formFeed ||
			ch === CharacterCodes.nonBreakingSpace ||
			ch === CharacterCodes.nextLine ||
			ch === CharacterCodes.ogham ||
			(ch >= CharacterCodes.enQuad && ch <= CharacterCodes.zeroWidthSpace) ||
			ch === CharacterCodes.narrowNoBreakSpace ||
			ch === CharacterCodes.mathematicalSpace ||
			ch === CharacterCodes.ideographicSpace ||
			ch === CharacterCodes.byteOrderMark
		);
	}

	#isAtMultiLineCommentEnd(pos: number): boolean {
		return (
			pos + 1 < this.end &&
			this.text.charCodeAt(pos) === CharacterCodes.asterisk &&
			this.text.charCodeAt(pos + 1) === CharacterCodes.slash
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
			if (ch === CharacterCodes.lessThan) {
				++subTagsLevel;
				this.pos++;
				continue;
			}
			if (ch === CharacterCodes.greaterThan) {
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

			if (ch === CharacterCodes.backslash) {
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
				case CharacterCodes._0:
				case CharacterCodes._1:
				case CharacterCodes._2:
				case CharacterCodes._3:
				case CharacterCodes._4:
				case CharacterCodes._5:
				case CharacterCodes._6:
				case CharacterCodes._7:
				case CharacterCodes._8:
				case CharacterCodes._9:
					break;
				case CharacterCodes.dot:
					if (hadDot) {
						result += this.text.substring(start, this.pos);
						return result;
					}
					hadDot = true;
					hadMinus = true;
					break;
				case CharacterCodes.minus:
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
				(ch >= CharacterCodes.a && ch <= CharacterCodes.z) ||
				(ch >= CharacterCodes.A && ch <= CharacterCodes.Z)
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
				ch === CharacterCodes._ ||
				(CharacterCodes.A <= ch && ch <= CharacterCodes.Z) ||
				(CharacterCodes.a <= ch && ch <= CharacterCodes.z) ||
				(CharacterCodes._0 <= ch && ch <= CharacterCodes._9)
			);
		case syntaxKind.HtmlIdentifier:
			// TODO: This may not be all char codes
			return (
				ch === CharacterCodes._ ||
				ch === CharacterCodes.lessThan ||
				ch === CharacterCodes.equals ||
				ch === CharacterCodes.doubleQuote ||
				(CharacterCodes.A <= ch && ch <= CharacterCodes.Z) ||
				(CharacterCodes.a <= ch && ch <= CharacterCodes.z) ||
				(CharacterCodes._0 <= ch && ch <= CharacterCodes._9)
			);
		case syntaxKind.StringLiteral:
			// TODO: This may not be all char codes
			return (
				ch === CharacterCodes._ ||
				ch === CharacterCodes.backslash ||
				ch === CharacterCodes.lessThan ||
				ch === CharacterCodes.equals ||
				ch === CharacterCodes.doubleQuote ||
				(CharacterCodes.A <= ch && ch <= CharacterCodes.Z) ||
				(CharacterCodes.a <= ch && ch <= CharacterCodes.z) ||
				(CharacterCodes._0 <= ch && ch <= CharacterCodes._9)
			);
		case syntaxKind.NumericIdentifier:
			return (
				ch === CharacterCodes.minus ||
				ch === CharacterCodes.dot ||
				(CharacterCodes._0 <= ch && ch <= CharacterCodes._9)
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
	if (ch === CharacterCodes.lessThan) return syntaxKind.HtmlIdentifier;
	if (ch === CharacterCodes.doubleQuote) return syntaxKind.StringLiteral;
	if (
		ch === CharacterCodes._ ||
		(CharacterCodes.A <= ch && ch <= CharacterCodes.Z) ||
		(CharacterCodes.a <= ch && ch <= CharacterCodes.z)
	)
		return syntaxKind.TextIdentifier;

	if (
		ch === CharacterCodes.minus ||
		ch === CharacterCodes.dot ||
		(CharacterCodes._0 <= ch && ch <= CharacterCodes._9)
	)
		return syntaxKind.NumericIdentifier;

	return undefined;
}

export function isIdentifierStart(ch: number): boolean {
	// TODO: Check Identifiers
	return (
		(ch >= CharacterCodes.A && ch <= CharacterCodes.Z) ||
		(ch >= CharacterCodes.a && ch <= CharacterCodes.z) ||
		(ch >= CharacterCodes._0 && ch <= CharacterCodes._9) ||
		ch === CharacterCodes._ ||
		ch === CharacterCodes.lessThan ||
		ch === CharacterCodes.doubleQuote
	);
}

function isIdentifierPart(ch: number): boolean {
	return (
		(ch >= CharacterCodes.A && ch <= CharacterCodes.Z) ||
		(ch >= CharacterCodes.a && ch <= CharacterCodes.z) ||
		(ch >= CharacterCodes._0 && ch <= CharacterCodes._9) ||
		ch === CharacterCodes.$ ||
		ch === CharacterCodes._ ||
		ch > CharacterCodes.maxAsciiCharacter
	);
}

export function skipTrivia(text: string, pos: number /* stopAtComments = false */): number {
	// When changed, also change the implementation in the scanner
	while (true) {
		const ch = text.charCodeAt(pos);
		switch (ch) {
			case CharacterCodes.carriageReturn:
				if (text.charCodeAt(pos + 1) === CharacterCodes.lineFeed) ++pos;
				continue;
			case CharacterCodes.lineFeed:
			case CharacterCodes.tab:
			case CharacterCodes.verticalTab:
			case CharacterCodes.formFeed:
			case CharacterCodes.space:
				++pos;
				continue;
			case CharacterCodes.hash: {
				// Skip single line comments started using hash
				++pos;
				while (pos < text.length) {
					if (isLineBreak(text.charCodeAt(pos))) break;
					++pos;
				}
				continue;
			}
			case CharacterCodes.slash:
				if (pos + 1 < text.length) {
					const nextChar = text.charCodeAt(pos + 1);

					switch (nextChar) {
						case CharacterCodes.slash: {
							pos += 2;
							while (pos < text.length) {
								if (isLineBreak(text.charCodeAt(pos))) break;
								++pos;
							}
							continue;
						}
						case CharacterCodes.asterisk: {
							pos += 2;
							while (pos < text.length) {
								if (
									text.charCodeAt(pos) === CharacterCodes.asterisk &&
									text.charCodeAt(pos + 1) === CharacterCodes.slash
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
	return ch === CharacterCodes.lineFeed || ch === CharacterCodes.carriageReturn;
}
