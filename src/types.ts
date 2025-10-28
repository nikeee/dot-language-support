export const errorSource = {
	Scan: 1,
	Parse: 2,
	Check: 4,
} as const;
export type ErrorSource = (typeof errorSource)[keyof typeof errorSource];

export type ErrorCode = ParseErrorCode | ScanErrorCode | CheckErrorCode;

export interface ParseErrorCode {
	source: typeof errorSource.Parse;
	sub: ParseError;
}
export interface ScanErrorCode {
	source: typeof errorSource.Scan;
	sub: ScanError;
}
export interface CheckErrorCode {
	source: typeof errorSource.Check;
	sub: CheckError;
}

export const parseError = {
	ExpectationFailed: 0,
	TrailingData: 1,
	FailedListParsing: 2,
} as const;
export type ParseError = (typeof parseError)[keyof typeof parseError];

export const scanError = {
	ExpectationFailed: 0,
	Unterminated: 1,
} as const;
export type ScanError = (typeof scanError)[keyof typeof scanError];

export const checkError = {
	InvalidEdgeOperation: 0,
	InvalidShapeName: 1,
} as const;
export type CheckError = (typeof checkError)[keyof typeof checkError];

export interface DiagnosticMessage {
	message: string;
	code: ErrorCode;
	category: DiagnosticCategory;
	start: number;
	end: number;
}

export const diagnosticCategory = {
	Error: 1,
	Warning: 2,
	Message: 3,
	Suggestion: 4,
} as const;
export type DiagnosticCategory = (typeof diagnosticCategory)[keyof typeof diagnosticCategory];

export type ID = string;

export interface SourceFile {
	content: string;
	graph?: Graph;
	identifiers: Set<ID>; // init via parser
	diagnostics: DiagnosticMessage[];
	symbols?: SymbolTable; // init via binder
	colors?: ColorTable; // init via binder
}

export interface HtmlIdentifier extends SyntaxNode {
	kind: typeof syntaxKind.HtmlIdentifier;

	htmlContent: string;
	// open: Token<typeof syntaxKind.LessThan>;
	// close: Token<typeof syntaxKind.GreaterThan>;
}
export interface TextIdentifier extends SyntaxNode {
	kind: typeof syntaxKind.TextIdentifier;

	text: string;
}

export interface QuotedTextIdentifier extends SyntaxNode {
	kind: typeof syntaxKind.QuotedTextIdentifier;

	values: SyntaxNodeArray<StringLiteral>;
	concatenation?: string;
}
export interface StringLiteral extends SyntaxNode {
	kind: typeof syntaxKind.StringLiteral;

	text: string;
}
export interface NumericIdentifier extends SyntaxNode {
	kind: typeof syntaxKind.NumericIdentifier;

	text: string;
	value: number;
}
export type Identifier = TextIdentifier | QuotedTextIdentifier | HtmlIdentifier | NumericIdentifier;

export interface Graph extends SyntaxNode {
	kind: typeof syntaxKind.DirectedGraph | typeof syntaxKind.UndirectedGraph;

	keyword: Token<typeof syntaxKind.GraphKeyword | typeof syntaxKind.DigraphKeyword>;
	strict?: Token<typeof syntaxKind.StrictKeyword>;
	id?: Identifier;
	statements: SyntaxNodeArray<Statement>;
	// openBrace: Token<typeof syntaxKind.OpenBraceToken>;
	// closeBrace: Token<typeof syntaxKind.CloseBraceToken>;
}

export interface StatementBase {
	terminator?: StatementSeparator;
}
export type StatementSeparator = Token<typeof syntaxKind.SemicolonToken>;

export type Statement =
	| NodeStatement
	| EdgeStatement
	| AttributeStatement
	| IdEqualsIdStatement
	| SubGraphStatement;

export interface NodeStatement extends SyntaxNode, StatementBase {
	kind: typeof syntaxKind.NodeStatement;

	id: NodeId;
	attributes: SyntaxNodeArray<AttributeContainer>;
}

export interface NodeId extends SyntaxNode {
	kind: typeof syntaxKind.NodeId;

	id: Identifier;
	port?: PortDeclaration;
}

export type EdgeSourceOrTarget = NodeId | SubGraph;

export interface EdgeStatement extends SyntaxNode, StatementBase {
	kind: typeof syntaxKind.EdgeStatement;

	source: EdgeSourceOrTarget;
	rhs: SyntaxNodeArray<EdgeRhs>;
	attributes: SyntaxNodeArray<AttributeContainer>;
}

export interface AttributeStatement extends SyntaxNode, StatementBase {
	kind: typeof syntaxKind.AttributeStatement;

	subject:
		| Token<typeof syntaxKind.GraphKeyword>
		| Token<typeof syntaxKind.NodeKeyword>
		| Token<typeof syntaxKind.EdgeKeyword>;
	attributes: SyntaxNodeArray<AttributeContainer>;
}

export interface IdEqualsIdStatement extends SyntaxNode, StatementBase {
	kind: typeof syntaxKind.IdEqualsIdStatement;

	leftId: Identifier;
	// equalsToken: Token<typeof syntaxKind.EqualsToken>;
	rightId: Identifier;
}

export interface SubGraph extends SyntaxNode {
	kind: typeof syntaxKind.SubGraph;

	id?: Identifier;
	statements: SyntaxNodeArray<Statement>;
}

export interface SubGraphStatement extends SyntaxNode, StatementBase {
	kind: typeof syntaxKind.SubGraphStatement;

	subgraph: SubGraph;
}

export interface EdgeRhs extends SyntaxNode {
	kind: typeof syntaxKind.EdgeRhs;

	operation: EdgeOp;
	target: EdgeSourceOrTarget;
}

export interface AttributeContainer extends SyntaxNode {
	kind: typeof syntaxKind.AttributeContainer;

	openBracket: Token<typeof syntaxKind.OpenBracketToken>;
	assignments: SyntaxNodeArray<Assignment>;
	closeBracket: Token<typeof syntaxKind.CloseBracketToken>;
}

export interface Assignment extends SyntaxNode {
	kind: typeof syntaxKind.Assignment;

	leftId: Identifier;
	// equalsToken: Token<typeof syntaxKind.EqualsToken>;
	rightId: Identifier;
	terminator?: AssignmentSeparator;
}

export type AssignmentSeparator =
	| Token<typeof syntaxKind.SemicolonToken>
	| Token<typeof syntaxKind.CommaToken>;

export type PortDeclaration = NormalPortDeclaration | CompassPortDeclaration;

export interface NormalPortDeclaration extends SyntaxNode {
	kind: typeof syntaxKind.NormalPortDeclaration;

	colon: Token<typeof syntaxKind.ColonToken>;
	id: Identifier;
	compassPt?: CompassPortDeclaration;
}
export interface CompassPortDeclaration extends SyntaxNode {
	kind: typeof syntaxKind.CompassPortDeclaration;

	colon: Token<typeof syntaxKind.ColonToken>;
	compassPt: CompassPort;
}
export type CompassPort =
	| Token<typeof syntaxKind.CompassNorthToken>
	| Token<typeof syntaxKind.CompassNorthEastToken>
	| Token<typeof syntaxKind.CompassEastToken>
	| Token<typeof syntaxKind.CompassSouthEastToken>
	| Token<typeof syntaxKind.CompassSouthToken>
	| Token<typeof syntaxKind.CompassSouthWestToken>
	| Token<typeof syntaxKind.CompassWestToken>
	| Token<typeof syntaxKind.CompassNorthWestToken>
	| Token<typeof syntaxKind.CompassCenterToken>
	| Token<typeof syntaxKind.UnderscoreToken>;

export type EdgeOp =
	| Token<typeof syntaxKind.DirectedEdgeOp>
	| Token<typeof syntaxKind.UndirectedEdgeOp>;

export interface TextRange {
	pos: number;
	end: number;
}

export type SyntaxKind = (typeof syntaxKind)[keyof typeof syntaxKind];
export const syntaxKind = {
	Unknown: 0,
	EndOfFileToken: 1,
	NewLineTrivia: 2,
	WhitespaceTrivia: 3,

	HashCommentTrivia: 4,
	SingleLineCommentTrivia: 5,
	MultiLineCommentTrivia: 6,

	CommaToken: 7,
	SemicolonToken: 8,
	PlusToken: 9,
	OpenBraceToken: 10,
	CloseBraceToken: 11,
	OpenBracketToken: 12,
	CloseBracketToken: 13,
	ColonToken: 14,
	EqualsToken: 15,
	LessThan: 16,
	GreaterThan: 17,

	CompassNorthToken: 18,
	CompassNorthEastToken: 19,
	CompassEastToken: 20,
	CompassSouthEastToken: 21,
	CompassSouthToken: 22,
	CompassSouthWestToken: 23,
	CompassWestToken: 24,
	CompassNorthWestToken: 25,
	CompassCenterToken: 26,
	UnderscoreToken: 27,

	StringLiteral: 28,

	HtmlIdentifier: 29,
	TextIdentifier: 30,
	QuotedTextIdentifier: 31, // Contains multiple "QuotedTextIdentifier" for concatenation with +
	NumericIdentifier: 32,

	GraphKeyword: 33,
	DigraphKeyword: 34,
	NodeKeyword: 35,
	EdgeKeyword: 36,
	SubgraphKeyword: 37,
	StrictKeyword: 38,

	DirectedEdgeOp: 39,
	UndirectedEdgeOp: 40,

	DirectedGraph: 41,
	UndirectedGraph: 42,
	NodeStatement: 43,
	EdgeStatement: 44,
	AttributeStatement: 45,
	IdEqualsIdStatement: 46,
	SubGraph: 47,
	SubGraphStatement: 48,
	EdgeRhs: 49,
	AttributeContainer: 50,
	Assignment: 51,
	NormalPortDeclaration: 52,
	CompassPortDeclaration: 53,
	NodeId: 54,

	Count: 55, // Number of items in this enum

	FirstNode: 41, // DirectedGraph
	CompassBegin: 18, // CompassNorthToken,
	CompassEnd: 27, // UnderscoreToken,

	LastKeyword: 38, // StrictKeyword,

	// Identifier: QuotedTextIdentifier | HtmlIdentifier | TextIdentifier | NumericIdentifier,
} as const;

/** reverse lookup because we cannot make syntaxKind an enum */
export const syntaxKindNames = {
	0: "Unknown",
	1: "EndOfFileToken",
	2: "NewLineTrivia",
	3: "WhitespaceTrivia",

	4: "HashCommentTrivia",
	5: "SingleLineCommentTrivia",
	6: "MultiLineCommentTrivia",

	7: "CommaToken",
	8: "SemicolonToken",
	9: "PlusToken",
	10: "OpenBraceToken",
	11: "CloseBraceToken",
	12: "OpenBracketToken",
	13: "CloseBracketToken",
	14: "ColonToken",
	15: "EqualsToken",
	16: "LessThan",
	17: "GreaterThan",

	18: "CompassNorthToken",
	19: "CompassNorthEastToken",
	20: "CompassEastToken",
	21: "CompassSouthEastToken",
	22: "CompassSouthToken",
	23: "CompassSouthWestToken",
	24: "CompassWestToken",
	25: "CompassNorthWestToken",
	26: "CompassCenterToken",
	27: "UnderscoreToken",

	28: "StringLiteral",

	29: "HtmlIdentifier",
	30: "TextIdentifier",
	31: "QuotedTextIdentifier", // Contains multiple "QuotedTextIdentifier" for concatenation with +
	32: "NumericIdentifier",

	33: "GraphKeyword",
	34: "DigraphKeyword",
	35: "NodeKeyword",
	36: "EdgeKeyword",
	37: "SubgraphKeyword",
	38: "StrictKeyword",

	39: "DirectedEdgeOp",
	40: "UndirectedEdgeOp",

	41: "DirectedGraph",
	42: "UndirectedGraph",
	43: "NodeStatement",
	44: "EdgeStatement",
	45: "AttributeStatement",
	46: "IdEqualsIdStatement",
	47: "SubGraph",
	48: "SubGraphStatement",
	49: "EdgeRhs",
	50: "AttributeContainer",
	51: "Assignment",
	52: "NormalPortDeclaration",
	53: "CompassPortDeclaration",
	54: "NodeId",

	55: "Count", // Number of items in this enum
} as const;

export interface SyntaxNode extends TextRange {
	kind: SyntaxKind;

	flags: SyntaxNodeFlags;

	graphContext?: GraphContext; // init via binding
	parent?: SyntaxNode; // init via binding
	symbol?: TypeSymbol; // init via binding
}

export interface Token<TKind extends SyntaxKind> extends SyntaxNode {
	kind: TKind;
}

export interface SyntaxNodeArray<T extends SyntaxNode> extends ReadonlyArray<T>, TextRange {
	hasTrailingComma?: boolean;
}
export type MutableSyntaxNodeArray<T extends SyntaxNode> = SyntaxNodeArray<T> & T[];

export const enum SyntaxNodeFlags {
	None = 0,
	ContainsErrors = 1 << 1,
	Synthesized = 1 << 2,
}

export const enum GraphContext {
	None = 0,
	Strict = 1 << 1,
	Directed = 1 << 2,
	Undirected = 1 << 3,
}

export const enum TokenFlags {
	None = 0,
	Unterminated = 1 << 1,
	PrecedingLineBreak = 1 << 2,
}

export const enum CharacterCodes {
	nullCharacter = 0,
	maxAsciiCharacter = 0x7f,

	lineFeed = 0x0a, // \n
	carriageReturn = 0x0d, // \r
	lineSeparator = 0x2028,
	paragraphSeparator = 0x2029,
	nextLine = 0x0085,

	// Unicode 3.0 space characters
	space = 0x0020, // " "
	nonBreakingSpace = 0x00a0, //
	enQuad = 0x2000,
	emQuad = 0x2001,
	enSpace = 0x2002,
	emSpace = 0x2003,
	threePerEmSpace = 0x2004,
	fourPerEmSpace = 0x2005,
	sixPerEmSpace = 0x2006,
	figureSpace = 0x2007,
	punctuationSpace = 0x2008,
	thinSpace = 0x2009,
	hairSpace = 0x200a,
	zeroWidthSpace = 0x200b,
	narrowNoBreakSpace = 0x202f,
	ideographicSpace = 0x3000,
	mathematicalSpace = 0x205f,
	ogham = 0x1680,

	_ = 0x5f,
	$ = 0x24,

	_0 = 0x30,
	_1 = 0x31,
	_2 = 0x32,
	_3 = 0x33,
	_4 = 0x34,
	_5 = 0x35,
	_6 = 0x36,
	_7 = 0x37,
	_8 = 0x38,
	_9 = 0x39,

	a = 0x61,
	b = 0x62,
	c = 0x63,
	d = 0x64,
	e = 0x65,
	f = 0x66,
	g = 0x67,
	h = 0x68,
	i = 0x69,
	j = 0x6a,
	k = 0x6b,
	l = 0x6c,
	m = 0x6d,
	n = 0x6e,
	o = 0x6f,
	p = 0x70,
	q = 0x71,
	r = 0x72,
	s = 0x73,
	t = 0x74,
	u = 0x75,
	v = 0x76,
	w = 0x77,
	x = 0x78,
	y = 0x79,
	z = 0x7a,

	A = 0x41,
	B = 0x42,
	C = 0x43,
	D = 0x44,
	E = 0x45,
	F = 0x46,
	G = 0x47,
	H = 0x48,
	I = 0x49,
	J = 0x4a,
	K = 0x4b,
	L = 0x4c,
	M = 0x4d,
	N = 0x4e,
	O = 0x4f,
	P = 0x50,
	Q = 0x51,
	R = 0x52,
	S = 0x53,
	T = 0x54,
	U = 0x55,
	V = 0x56,
	W = 0x57,
	X = 0x58,
	Y = 0x59,
	Z = 0x5a,

	ampersand = 0x26, // &
	asterisk = 0x2a, // *
	at = 0x40, // @
	backslash = 0x5c, // \
	backtick = 0x60, // `
	bar = 0x7c, // |
	caret = 0x5e, // ^
	closeBrace = 0x7d, // }
	closeBracket = 0x5d, // ]
	closeParen = 0x29, // )
	colon = 0x3a, // :
	comma = 0x2c, // ,
	dot = 0x2e, // .
	doubleQuote = 0x22, // "
	equals = 0x3d, // =
	exclamation = 0x21, // !
	greaterThan = 0x3e, // >
	hash = 0x23, // #
	lessThan = 0x3c, // <
	minus = 0x2d, // -
	openBrace = 0x7b, // {
	openBracket = 0x5b, // [
	openParen = 0x28, // (
	percent = 0x25, // %
	plus = 0x2b, // +
	question = 0x3f, // ?
	semicolon = 0x3b, // ;
	singleQuote = 0x27, // '
	slash = 0x2f, // /
	tilde = 0x7e, // ~

	backspace = 0x08, // \b
	formFeed = 0x0c, // \f
	byteOrderMark = 0xfeff,
	tab = 0x09, // \t
	verticalTab = 0x0b, // \v
}

export type SymbolTable = Map<string, TypeSymbol>;
export type ColorTable = Map<string, ColorInfo>;

export interface TypeSymbol {
	name: string;
	firstMention: SyntaxNode;
	references?: SyntaxNode[];
	members?: SymbolTable; // sub-types (when current syntax node is a NodeStatement, members are the attribute left IDs)
}

export interface ColorInfo {
	node: SyntaxNode;
}

/** Color representation for LSP */
export interface Color {
	/** The red component of this color in the range [0-1]. */
	readonly red: number;
	/** The green component of this color in the range [0-1]. */
	readonly green: number;
	/** The blue component of this color in the range [0-1]. */
	readonly blue: number;
	/** The alpha component of this color in the range [0-1]. */
	readonly alpha: number;
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type StatementOf<T extends Statement["kind"]> = T extends typeof syntaxKind.SubGraphStatement
	? SubGraphStatement
	: T extends typeof syntaxKind.AttributeStatement
		? AttributeStatement
		: T extends typeof syntaxKind.EdgeStatement
			? EdgeStatement
			: T extends typeof syntaxKind.IdEqualsIdStatement
				? IdEqualsIdStatement
				: T extends typeof syntaxKind.NodeStatement
					? NodeStatement
					: never;
