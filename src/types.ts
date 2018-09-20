export const enum ErrorSource {
	Scan = 1,
	Parse = 2,
	Check = 4,
}

export type ErrorCode = ParseErrorCode | ScanErrorCode | CheckErrorCode;

export interface ParseErrorCode {
	source: ErrorSource.Parse;
	sub: ParseError;
}
export interface ScanErrorCode {
	source: ErrorSource.Scan;
	sub: ScanError;
}
export interface CheckErrorCode {
	source: ErrorSource.Check;
	sub: CheckError;
}

export const enum ParseError {
	ExpectationFailed,
	TrailingData,
	FailedListParsing,
}

export const enum ScanError {
	ExpectationFailed,
	Unterminated,
}

export const enum CheckError {
	InvalidEdgeOperation,
}

export interface DiagnosticMessage {
	message: string;
	code: ErrorCode;
	category: DiagnosticCategory;
	start: number;
	end: number;
}

export enum DiagnosticCategory {
	Error = 1,
	Warning = 2,
	Message = 3,
	Suggestion = 4,
}

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
	kind: SyntaxKind.HtmlIdentifier;

	htmlContent: string;
	// open: Token<SyntaxKind.LessThan>;
	// close: Token<SyntaxKind.GreaterThan>;
}
export interface TextIdentifier extends SyntaxNode {
	kind: SyntaxKind.TextIdentifier;

	text: string;
}

export interface QuotedTextIdentifier extends SyntaxNode {
	kind: SyntaxKind.QuotedTextIdentifier;

	values: SyntaxNodeArray<StringLiteral>;
	concatenation?: string;
}
export interface StringLiteral extends SyntaxNode {
	kind: SyntaxKind.StringLiteral;

	text: string;
}
export interface NumericIdentifier extends SyntaxNode {
	kind: SyntaxKind.NumericIdentifier;

	text: string;
	value: number;
}
export type Identifier = TextIdentifier
	| QuotedTextIdentifier
	| HtmlIdentifier
	| NumericIdentifier;

export interface Graph extends SyntaxNode {
	kind: SyntaxKind.DirectedGraph | SyntaxKind.UndirectedGraph

	keyword: Token<SyntaxKind.GraphKeyword | SyntaxKind.DigraphKeyword>
	strict?: Token<SyntaxKind.StrictKeyword>;
	id?: Identifier;
	statements: SyntaxNodeArray<Statement>;
	// openBrace: Token<SyntaxKind.OpenBraceToken>;
	// closeBrace: Token<SyntaxKind.CloseBraceToken>;
}

export interface StatementBase {
	terminator?: StatementSeparator;
}
export type StatementSeparator = Token<SyntaxKind.SemicolonToken>;


export type Statement = NodeStatement
	| EdgeStatement
	| AttributeStatement
	| IdEqualsIdStatement
	| SubGraphStatement;

export interface NodeStatement extends SyntaxNode, StatementBase {
	kind: SyntaxKind.NodeStatement;

	id: NodeId;
	attributes: SyntaxNodeArray<AttributeContainer>;
}

export interface NodeId extends SyntaxNode {
	kind: SyntaxKind.NodeId;

	id: Identifier;
	point?: PointDeclaration;
}

export type EdgeSourceOrTarget = NodeId | SubGraph;

export interface EdgeStatement extends SyntaxNode, StatementBase {
	kind: SyntaxKind.EdgeStatement;

	source: EdgeSourceOrTarget;
	rhs: SyntaxNodeArray<EdgeRhs>;
	attributes: SyntaxNodeArray<AttributeContainer>;
}

export interface AttributeStatement extends SyntaxNode, StatementBase {
	kind: SyntaxKind.AttributeStatement;

	subject: Token<SyntaxKind.GraphKeyword> | Token<SyntaxKind.NodeKeyword> | Token<SyntaxKind.EdgeKeyword>;
	attributes: SyntaxNodeArray<AttributeContainer>;
}

export interface IdEqualsIdStatement extends SyntaxNode, StatementBase {
	kind: SyntaxKind.IdEqualsIdStatement;

	leftId: Identifier;
	// equalsToken: Token<SyntaxKind.EqualsToken>;
	rightId: Identifier;
}

export interface SubGraph extends SyntaxNode {
	kind: SyntaxKind.SubGraph;

	id?: Identifier;
	statements: SyntaxNodeArray<Statement>;
}

export interface SubGraphStatement extends SyntaxNode, StatementBase {
	kind: SyntaxKind.SubGraphStatement;

	subgraph: SubGraph;
}

export interface EdgeRhs extends SyntaxNode {
	kind: SyntaxKind.EdgeRhs;

	operation: EdgeOp;
	target: EdgeSourceOrTarget;
}

export interface AttributeContainer extends SyntaxNode {
	kind: SyntaxKind.AttributeContainer;

	assignments: SyntaxNodeArray<Assignment>;
	// openBracket: Token<SyntaxKind.OpenBracketToken>;
	// closeBracket: Token<SyntaxKind.CloseBracketToken>;
}

export interface Assignment extends SyntaxNode {
	kind: SyntaxKind.Assignment;

	leftId: Identifier;
	// equalsToken: Token<SyntaxKind.EqualsToken>;
	rightId: Identifier;
	terminator?: AssignmentSeparator;
}

export type AssignmentSeparator = Token<SyntaxKind.SemicolonToken> | Token<SyntaxKind.CommaToken>;

export type PointDeclaration = NormalPointDeclaration | CompassPointDeclaration;

export interface NormalPointDeclaration extends SyntaxNode {
	kind: SyntaxKind.NormalPointDeclaration;

	colon: Token<SyntaxKind.ColonToken>;
	id: Identifier;
	compassPt?: CompassPointDeclaration;
}
export interface CompassPointDeclaration extends SyntaxNode {
	kind: SyntaxKind.CompassPointDeclaration;

	colon: Token<SyntaxKind.ColonToken>;
	compassPt: CompassPoint;
}
export type CompassPoint = Token<SyntaxKind.CompassNorthToken>
	| Token<SyntaxKind.CompassNorthEastToken>
	| Token<SyntaxKind.CompassEastToken>
	| Token<SyntaxKind.CompassSouthEastToken>
	| Token<SyntaxKind.CompassSouthToken>
	| Token<SyntaxKind.CompassSouthWestToken>
	| Token<SyntaxKind.CompassWestToken>
	| Token<SyntaxKind.CompassNorthWestToken>
	| Token<SyntaxKind.CompassCenterToken>
	| Token<SyntaxKind.UnderscoreToken>;

export type EdgeOp = Token<SyntaxKind.DirectedEdgeOp> | Token<SyntaxKind.UndirectedEdgeOp>;

export interface TextRange {
	pos: number;
	end: number;
}

export /* const */ enum SyntaxKind {
	Unknown,
	EndOfFileToken,
	NewLineTrivia,
	WhitespaceTrivia,

	HashCommentTrivia,
	SingleLineCommentTrivia,
	MultiLineCommentTrivia,

	CommaToken,
	SemicolonToken,
	PlusToken,
	OpenBraceToken,
	CloseBraceToken,
	OpenBracketToken,
	CloseBracketToken,
	ColonToken,
	EqualsToken,
	LessThan,
	GreaterThan,

	CompassNorthToken,
	CompassNorthEastToken,
	CompassEastToken,
	CompassSouthEastToken,
	CompassSouthToken,
	CompassSouthWestToken,
	CompassWestToken,
	CompassNorthWestToken,
	CompassCenterToken,
	UnderscoreToken,

	StringLiteral,

	HtmlIdentifier,
	TextIdentifier,
	QuotedTextIdentifier, // Contains multiple "QuotedTextIdentifier" for concatenation with +
	NumericIdentifier,

	GraphKeyword,
	DigraphKeyword,
	NodeKeyword,
	EdgeKeyword,
	SubgraphKeyword,
	StrictKeyword,

	DirectedEdgeOp,
	UndirectedEdgeOp,

	DirectedGraph,
	UndirectedGraph,
	NodeStatement,
	EdgeStatement,
	AttributeStatement,
	IdEqualsIdStatement,
	SubGraph,
	SubGraphStatement,
	EdgeRhs,
	AttributeContainer,
	Assignment,
	NormalPointDeclaration,
	CompassPointDeclaration,
	NodeId,

	Count, // Number of items in this enum

	FirstNode = DirectedGraph,
	CompassBegin = CompassNorthToken,
	CompassEnd = UnderscoreToken,


	LastKeyword = StrictKeyword,

	// Identifier = QuotedTextIdentifier | HtmlIdentifier | TextIdentifier | NumericIdentifier,
}

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
	maxAsciiCharacter = 0x7F,

	lineFeed = 0x0A,              // \n
	carriageReturn = 0x0D,        // \r
	lineSeparator = 0x2028,
	paragraphSeparator = 0x2029,
	nextLine = 0x0085,

	// Unicode 3.0 space characters
	space = 0x0020,   // " "
	nonBreakingSpace = 0x00A0,   //
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
	hairSpace = 0x200A,
	zeroWidthSpace = 0x200B,
	narrowNoBreakSpace = 0x202F,
	ideographicSpace = 0x3000,
	mathematicalSpace = 0x205F,
	ogham = 0x1680,

	_ = 0x5F,
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
	j = 0x6A,
	k = 0x6B,
	l = 0x6C,
	m = 0x6D,
	n = 0x6E,
	o = 0x6F,
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
	z = 0x7A,

	A = 0x41,
	B = 0x42,
	C = 0x43,
	D = 0x44,
	E = 0x45,
	F = 0x46,
	G = 0x47,
	H = 0x48,
	I = 0x49,
	J = 0x4A,
	K = 0x4B,
	L = 0x4C,
	M = 0x4D,
	N = 0x4E,
	O = 0x4F,
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

	ampersand = 0x26,             // &
	asterisk = 0x2A,              // *
	at = 0x40,                    // @
	backslash = 0x5C,             // \
	backtick = 0x60,              // `
	bar = 0x7C,                   // |
	caret = 0x5E,                 // ^
	closeBrace = 0x7D,            // }
	closeBracket = 0x5D,          // ]
	closeParen = 0x29,            // )
	colon = 0x3A,                 // :
	comma = 0x2C,                 // ,
	dot = 0x2E,                   // .
	doubleQuote = 0x22,           // "
	equals = 0x3D,                // =
	exclamation = 0x21,           // !
	greaterThan = 0x3E,           // >
	hash = 0x23,                  // #
	lessThan = 0x3C,              // <
	minus = 0x2D,                 // -
	openBrace = 0x7B,             // {
	openBracket = 0x5B,           // [
	openParen = 0x28,             // (
	percent = 0x25,               // %
	plus = 0x2B,                  // +
	question = 0x3F,              // ?
	semicolon = 0x3B,             // ;
	singleQuote = 0x27,           // '
	slash = 0x2F,                 // /
	tilde = 0x7E,                 // ~

	backspace = 0x08,             // \b
	formFeed = 0x0C,              // \f
	byteOrderMark = 0xFEFF,
	tab = 0x09,                   // \t
	verticalTab = 0x0B,           // \v
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

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type StatementOf<T extends Statement["kind"]> = T extends SyntaxKind.SubGraphStatement ? SubGraphStatement
	: T extends SyntaxKind.AttributeStatement ? AttributeStatement
	: T extends SyntaxKind.EdgeStatement ? EdgeStatement
	: T extends SyntaxKind.IdEqualsIdStatement ? IdEqualsIdStatement
	: T extends SyntaxKind.NodeStatement ? NodeStatement : never;
