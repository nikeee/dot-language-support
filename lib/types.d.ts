export declare const enum ErrorSource {
    Scan = 1,
    Parse = 2,
    Check = 4,
}
export declare type ErrorCode = ParseErrorCode | ScanErrorCode | CheckErrorCode;
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
export declare const enum ParseError {
    ExpectationFailed = 0,
    TrailingData = 1,
    FailedListParsing = 2,
}
export declare const enum ScanError {
    ExpectationFailed = 0,
    Unterminated = 1,
}
export declare const enum CheckError {
    InvalidEdgeOperation = 0,
}
export interface DiagnosticMessage {
    message: string;
    code: ErrorCode;
    category: DiagnosticCategory;
    start: number;
    end: number;
}
export declare enum DiagnosticCategory {
    Error = 1,
    Warning = 2,
    Message = 3,
    Suggestion = 4,
}
export declare type ID = string;
export interface SourceFile {
    content: string;
    graph?: Graph;
    identifiers: Set<ID>;
    diagnostics: DiagnosticMessage[];
    symbols?: SymbolTable;
}
export interface HtmlIdentifier extends SyntaxNode {
    kind: SyntaxKind.HtmlIdentifier;
    htmlContent: string;
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
export declare type Identifier = TextIdentifier | QuotedTextIdentifier | HtmlIdentifier | NumericIdentifier;
export interface Graph extends SyntaxNode {
    kind: SyntaxKind.DirectedGraph | SyntaxKind.UndirectedGraph;
    keyword: Token<SyntaxKind.GraphKeyword | SyntaxKind.DigraphKeyword>;
    strict?: Token<SyntaxKind.StrictKeyword>;
    id?: Identifier;
    statements: SyntaxNodeArray<Statement>;
}
export interface StatementBase {
    terminator?: StatementSeparator;
}
export declare type StatementSeparator = Token<SyntaxKind.SemicolonToken>;
export declare type Statement = NodeStatement | EdgeStatement | AttributeStatement | IdEqualsIdStatement | SubGraphStatement;
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
export declare type EdgeSourceOrTarget = NodeId | SubGraph;
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
}
export interface Assignment extends SyntaxNode {
    kind: SyntaxKind.Assignment;
    leftId: Identifier;
    rightId: Identifier;
    terminator?: AssignmentSeparator;
}
export declare type AssignmentSeparator = Token<SyntaxKind.SemicolonToken> | Token<SyntaxKind.CommaToken>;
export declare type PointDeclaration = NormalPointDeclaration | CompassPointDeclaration;
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
export declare type CompassPoint = Token<SyntaxKind.CompassNorthToken> | Token<SyntaxKind.CompassNorthEastToken> | Token<SyntaxKind.CompassEastToken> | Token<SyntaxKind.CompassSouthEastToken> | Token<SyntaxKind.CompassSouthToken> | Token<SyntaxKind.CompassSouthWestToken> | Token<SyntaxKind.CompassWestToken> | Token<SyntaxKind.CompassNorthWestToken> | Token<SyntaxKind.CompassCenterToken> | Token<SyntaxKind.UnderscoreToken>;
export declare type EdgeOp = Token<SyntaxKind.DirectedEdgeOp> | Token<SyntaxKind.UndirectedEdgeOp>;
export interface TextRange {
    pos: number;
    end: number;
}
export declare enum SyntaxKind {
    Unknown = 0,
    EndOfFileToken = 1,
    NewLineTrivia = 2,
    WhitespaceTrivia = 3,
    HashCommentTrivia = 4,
    SingleLineCommentTrivia = 5,
    MultiLineCommentTrivia = 6,
    CommaToken = 7,
    SemicolonToken = 8,
    PlusToken = 9,
    OpenBraceToken = 10,
    CloseBraceToken = 11,
    OpenBracketToken = 12,
    CloseBracketToken = 13,
    ColonToken = 14,
    EqualsToken = 15,
    LessThan = 16,
    GreaterThan = 17,
    CompassNorthToken = 18,
    CompassNorthEastToken = 19,
    CompassEastToken = 20,
    CompassSouthEastToken = 21,
    CompassSouthToken = 22,
    CompassSouthWestToken = 23,
    CompassWestToken = 24,
    CompassNorthWestToken = 25,
    CompassCenterToken = 26,
    UnderscoreToken = 27,
    StringLiteral = 28,
    HtmlIdentifier = 29,
    TextIdentifier = 30,
    QuotedTextIdentifier = 31,
    NumericIdentifier = 32,
    GraphKeyword = 33,
    DigraphKeyword = 34,
    NodeKeyword = 35,
    EdgeKeyword = 36,
    SubgraphKeyword = 37,
    StrictKeyword = 38,
    DirectedEdgeOp = 39,
    UndirectedEdgeOp = 40,
    DirectedGraph = 41,
    UndirectedGraph = 42,
    NodeStatement = 43,
    EdgeStatement = 44,
    AttributeStatement = 45,
    IdEqualsIdStatement = 46,
    SubGraph = 47,
    SubGraphStatement = 48,
    EdgeRhs = 49,
    AttributeContainer = 50,
    Assignment = 51,
    NormalPointDeclaration = 52,
    CompassPointDeclaration = 53,
    NodeId = 54,
    Count = 55,
    FirstNode = 41,
    CompassBegin = 18,
    CompassEnd = 27,
    LastKeyword = 38,
}
export interface SyntaxNode extends TextRange {
    kind: SyntaxKind;
    flags: SyntaxNodeFlags;
    graphContext?: GraphContext;
    parent?: SyntaxNode;
    symbol?: TypeSymbol;
}
export interface Token<TKind extends SyntaxKind> extends SyntaxNode {
    kind: TKind;
}
export interface SyntaxNodeArray<T extends SyntaxNode> extends ReadonlyArray<T>, TextRange {
    hasTrailingComma?: boolean;
}
export declare type MutableSyntaxNodeArray<T extends SyntaxNode> = SyntaxNodeArray<T> & T[];
export interface MapLike<T> {
    [index: string]: T;
}
export declare const enum SyntaxNodeFlags {
    None = 0,
    ContainsErrors = 2,
    Synthesized = 4,
}
export declare const enum GraphContext {
    None = 0,
    Strict = 2,
    Directed = 4,
    Undirected = 8,
}
export declare const enum TokenFlags {
    None = 0,
    Unterminated = 2,
    PrecedingLineBreak = 4,
}
export declare const enum CharacterCodes {
    nullCharacter = 0,
    maxAsciiCharacter = 127,
    lineFeed = 10,
    carriageReturn = 13,
    lineSeparator = 8232,
    paragraphSeparator = 8233,
    nextLine = 133,
    space = 32,
    nonBreakingSpace = 160,
    enQuad = 8192,
    emQuad = 8193,
    enSpace = 8194,
    emSpace = 8195,
    threePerEmSpace = 8196,
    fourPerEmSpace = 8197,
    sixPerEmSpace = 8198,
    figureSpace = 8199,
    punctuationSpace = 8200,
    thinSpace = 8201,
    hairSpace = 8202,
    zeroWidthSpace = 8203,
    narrowNoBreakSpace = 8239,
    ideographicSpace = 12288,
    mathematicalSpace = 8287,
    ogham = 5760,
    _ = 95,
    $ = 36,
    _0 = 48,
    _1 = 49,
    _2 = 50,
    _3 = 51,
    _4 = 52,
    _5 = 53,
    _6 = 54,
    _7 = 55,
    _8 = 56,
    _9 = 57,
    a = 97,
    b = 98,
    c = 99,
    d = 100,
    e = 101,
    f = 102,
    g = 103,
    h = 104,
    i = 105,
    j = 106,
    k = 107,
    l = 108,
    m = 109,
    n = 110,
    o = 111,
    p = 112,
    q = 113,
    r = 114,
    s = 115,
    t = 116,
    u = 117,
    v = 118,
    w = 119,
    x = 120,
    y = 121,
    z = 122,
    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,
    ampersand = 38,
    asterisk = 42,
    at = 64,
    backslash = 92,
    backtick = 96,
    bar = 124,
    caret = 94,
    closeBrace = 125,
    closeBracket = 93,
    closeParen = 41,
    colon = 58,
    comma = 44,
    dot = 46,
    doubleQuote = 34,
    equals = 61,
    exclamation = 33,
    greaterThan = 62,
    hash = 35,
    lessThan = 60,
    minus = 45,
    openBrace = 123,
    openBracket = 91,
    openParen = 40,
    percent = 37,
    plus = 43,
    question = 63,
    semicolon = 59,
    singleQuote = 39,
    slash = 47,
    tilde = 126,
    backspace = 8,
    formFeed = 12,
    byteOrderMark = 65279,
    tab = 9,
    verticalTab = 11,
}
export declare type SymbolTable = Map<string, TypeSymbol>;
export interface TypeSymbol {
    name: string;
    firstMention: SyntaxNode;
    references?: SyntaxNode[];
    members?: SymbolTable;
}
export declare type Diff<T extends string, U extends string> = ({
    [P in T]: P;
} & {
    [P in U]: never;
} & {
    [x: string]: never;
})[T];
export declare type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;
