import { Scanner } from "./scanner";
import { SyntaxKind, SourceFile, Identifier, SyntaxNode, DiagnosticMessage } from "./types";
export declare enum ParsingContext {
    None = 0,
    StatementList = 1,
    AttributeContainerList = 2,
    AssignmentList = 3,
    EdgeRhsList = 4,
    QuotedTextIdentifierConcatenation = 5,
    Count = 6,
}
export declare class Parser {
    currentToken: SyntaxKind;
    nodeCount: number;
    identifiers: Set<string>;
    identifierCount: number;
    sourceText: string;
    scanner: Scanner;
    currentNodeHasError: boolean;
    currentContext: ParsingContext;
    diagnostics: DiagnosticMessage[];
    constructor();
    private resetState();
    private nextToken();
    private token();
    private getLinesFromFile(sourceText);
    parse(sourceText: string): SourceFile;
    private parseGraph();
    private parseIdentifier();
    private registerIdentifier(id);
    private parseTextIdentifier();
    private parseQuotedTextIdentifierConcatenation();
    private parseQuotedTextIdentifier();
    private isQuotedStringFollowing();
    private parseHtmlIdentifier();
    private parseNumericIdentifier();
    private parseStatement();
    private parseAttributeStatement();
    private parseAttributeContainer();
    private isAssignmentStart();
    private parseIdEqualsIdStatement();
    private isIdEqualsIdStatement();
    private parseNodeStatement();
    private parseEdgeStatement(preceedingItem);
    private parseEdgeRhs();
    private createMissingNode<T>(kind);
    private parseAssignment();
    private parseSubGraph();
    private parseNodeId();
    private parseCompassPointDeclaration();
    private parseNormalPointDeclaration();
    private parsePointDeclaration();
    private isCompassPoint();
    private parseList<T>(context, parseElement, atLeastOne?);
    private getContextParseError(context);
    private isInSomeParsingContext();
    private abortListParsing(context);
    private isListElement(context, inErrorRecovery);
    private isListTerminator(context);
    private createEmptyArray<T>();
    private finishNode<T>(node, end?);
    private createNode(kind, pos?);
    private createNodeArray<T>(elements, pos, end?);
    private parseTokenNode<T>();
    private getLastError(diagnostics);
    private parseErrorAtPosition(start, end, message, code);
    private parseErrorAtCurrentToken(message, sub);
    private scanError(message, category, sub, length);
    private reportExpectedError<T>(expectedKinds);
    private parseExpectedOneOf<T>(...kinds);
    private parseExpectedTokenOneOf<T>(fallback, kinds);
    private parseExpectedToken<T>(kind);
    private parseExpected<T>(kind);
    private parseOptionalToken<T>(t);
    private parseOptional<T>(t);
    private isEdgeOp();
    private isIdentifier();
    private isCompassPointKind(kind);
    private speculationHelper(callback, isLookAhead);
    private lookAhead(callback);
    private tryParse(callback);
}
export declare function isIdentifier(kind: SyntaxKind): boolean;
export declare function isIdentifierNode<T extends SyntaxNode>(node: SyntaxNode): node is Identifier;
