"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const types_1 = require("./types");
const textToToken = core_1.createMapFromTemplate({
    "digraph": types_1.SyntaxKind.DigraphKeyword,
    "graph": types_1.SyntaxKind.GraphKeyword,
    "edge": types_1.SyntaxKind.EdgeKeyword,
    "node": types_1.SyntaxKind.NodeKeyword,
    "strict": types_1.SyntaxKind.StrictKeyword,
    "subgraph": types_1.SyntaxKind.SubgraphKeyword,
    "n": types_1.SyntaxKind.CompassNorthToken,
    "ne": types_1.SyntaxKind.CompassNorthEastToken,
    "e": types_1.SyntaxKind.CompassEastToken,
    "se": types_1.SyntaxKind.CompassSouthEastToken,
    "s": types_1.SyntaxKind.CompassSouthToken,
    "sw": types_1.SyntaxKind.CompassSouthWestToken,
    "w": types_1.SyntaxKind.CompassWestToken,
    "nw": types_1.SyntaxKind.CompassNorthWestToken,
    "c": types_1.SyntaxKind.CompassCenterToken,
    "+": types_1.SyntaxKind.PlusToken,
    "=": types_1.SyntaxKind.EqualsToken,
    "->": types_1.SyntaxKind.DirectedEdgeOp,
    "--": types_1.SyntaxKind.UndirectedEdgeOp,
    "{": types_1.SyntaxKind.OpenBraceToken,
    "}": types_1.SyntaxKind.CloseBraceToken,
    "[": types_1.SyntaxKind.OpenBracketToken,
    "]": types_1.SyntaxKind.CloseBracketToken,
    ";": types_1.SyntaxKind.SemicolonToken,
    ":": types_1.SyntaxKind.ColonToken,
    "_": types_1.SyntaxKind.UnderscoreToken,
    ",": types_1.SyntaxKind.CommaToken,
    "<": types_1.SyntaxKind.LessThan,
    ">": types_1.SyntaxKind.GreaterThan,
});
function makeReverseMap(source) {
    const result = new Map();
    source.forEach((value, key) => {
        result.set(value, key);
    });
    return result;
}
const tokenToText = makeReverseMap(textToToken);
function getTokenAsText(token) {
    return tokenToText.get(token);
}
exports.getTokenAsText = getTokenAsText;
function getTextAsToken(token) {
    return textToToken.get(token);
}
exports.getTextAsToken = getTextAsToken;
class DefaultScanner {
    setText(newText, start = 0, length) {
        this.text = newText || "";
        this.end = length === undefined ? this.text.length : start + length;
        this.setTextPos(start || 0);
    }
    setErrorCallback(cb) {
        this.onError = cb;
    }
    setTextPos(textPos) {
        console.assert(textPos >= 0);
        this.pos = textPos;
        this.startPos = textPos;
        this.tokenPos = textPos;
        this.token = types_1.SyntaxKind.Unknown;
        this.tokenValue = undefined;
        this.tokenFlags = 0;
    }
    scan(skipTrivia = true) {
        this.startPos = this.pos;
        this.tokenFlags = 0;
        this.isUnterminated = false;
        while (true) {
            this.tokenPos = this.pos;
            if (this.pos >= this.end) {
                return this.token = types_1.SyntaxKind.EndOfFileToken;
            }
            let ch = this.text.charCodeAt(this.pos);
            switch (ch) {
                case 10:
                case 13:
                    this.tokenFlags |= 4;
                    if (skipTrivia) {
                        this.pos++;
                        continue;
                    }
                    if (ch === 13
                        && this.pos + 1 < this.end
                        && this.text.charCodeAt(this.pos + 1) === 10) {
                        this.pos += 2;
                    }
                    else {
                        this.pos++;
                    }
                    return this.token = types_1.SyntaxKind.NewLineTrivia;
                case 9:
                case 11:
                case 12:
                case 32:
                    if (skipTrivia) {
                        this.pos++;
                        continue;
                    }
                    while (this.pos < this.end && this.isWhiteSpaceSingleLine(this.text.charCodeAt(this.pos)))
                        this.pos++;
                    return this.token = types_1.SyntaxKind.WhitespaceTrivia;
                case 35: {
                    const content = this.scanHashCommentTrivia(skipTrivia);
                    if (skipTrivia)
                        continue;
                    this.tokenValue = content;
                    return this.token = types_1.SyntaxKind.HashCommentTrivia;
                }
                case 47: {
                    if (this.pos + 1 < this.end) {
                        const nextChar = this.text.charCodeAt(this.pos + 1);
                        switch (nextChar) {
                            case 47: {
                                const commentContent = this.scanSingleLineCommentTrivia(skipTrivia);
                                if (skipTrivia)
                                    continue;
                                this.tokenValue = commentContent;
                                return this.token = types_1.SyntaxKind.SingleLineCommentTrivia;
                            }
                            case 42: {
                                const commentContent = this.scanMultiLineCommentTrivia(skipTrivia);
                                if (skipTrivia)
                                    continue;
                                this.tokenValue = commentContent;
                                return this.token = types_1.SyntaxKind.MultiLineCommentTrivia;
                            }
                        }
                    }
                    this.error('Unexpected "/". Did you mean to start a comment like "/*" or "//"? If you wanted to use it as an identifier, put it in double quotes.', 0);
                    ++this.pos;
                    break;
                }
                case 123:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.OpenBraceToken;
                case 125:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.CloseBraceToken;
                case 91:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.OpenBracketToken;
                case 93:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.CloseBracketToken;
                case 43:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.PlusToken;
                case 61:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.EqualsToken;
                case 48:
                case 49:
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56:
                case 57:
                case 46:
                    this.tokenValue = this.scanNumber();
                    return this.token = types_1.SyntaxKind.NumericIdentifier;
                case 45: {
                    const nextChar = this.text.charCodeAt(this.pos + 1);
                    switch (nextChar) {
                        case 45:
                            return this.pos += 2, this.token = types_1.SyntaxKind.UndirectedEdgeOp;
                        case 62:
                            return this.pos += 2, this.token = types_1.SyntaxKind.DirectedEdgeOp;
                        case 48:
                        case 49:
                        case 50:
                        case 51:
                        case 52:
                        case 53:
                        case 54:
                        case 55:
                        case 56:
                        case 57:
                        case 46:
                            this.tokenValue = this.scanNumber();
                            return this.token = types_1.SyntaxKind.NumericIdentifier;
                        default:
                            const chr = this.text.charAt(this.pos + 1);
                            this.error(`Unexpected "${chr}". Did you mean to define an edge? Depending on the type of graph you are defining, use "->" or "--".`, 0);
                            break;
                    }
                    this.pos++;
                    break;
                }
                case 95:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.UnderscoreToken;
                case 59:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.SemicolonToken;
                case 58:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.ColonToken;
                case 44:
                    this.pos++;
                    return this.token = types_1.SyntaxKind.CommaToken;
                case 60:
                    this.tokenValue = this.scanHtml();
                    return this.token = types_1.SyntaxKind.HtmlIdentifier;
                case 34:
                    this.tokenValue = this.scanString();
                    return this.token = types_1.SyntaxKind.StringLiteral;
                default:
                    {
                        if (isIdentifierStart(ch)) {
                            this.pos++;
                            while (this.pos < this.end && isIdentifierPart(ch = this.text.charCodeAt(this.pos)))
                                this.pos++;
                            const value = this.text.substring(this.tokenPos, this.pos);
                            this.tokenValue = value;
                            return this.token = this.getIdentifierToken(value);
                        }
                        if (this.isWhiteSpaceSingleLine(ch)) {
                            this.pos++;
                            continue;
                        }
                        const chr = this.text.charAt(this.pos);
                        this.error(`Unexpected "${chr}". Did you mean to start an identifier? Node names cannot start with "${chr}".`, 0);
                        this.pos++;
                        break;
                    }
            }
        }
    }
    error(message, sub, category = types_1.DiagnosticCategory.Error, errPos = this.pos, length = 0) {
        const cb = this.onError;
        if (cb) {
            const posSave = this.pos;
            this.pos = errPos;
            cb(message, category, sub, length);
            this.pos = posSave;
        }
    }
    isWhiteSpaceSingleLine(ch) {
        return ch === 32 ||
            ch === 9 ||
            ch === 11 ||
            ch === 12 ||
            ch === 160 ||
            ch === 133 ||
            ch === 5760 ||
            ch >= 8192 && ch <= 8203 ||
            ch === 8239 ||
            ch === 8287 ||
            ch === 12288 ||
            ch === 65279;
    }
    isAtMultiLineCommentEnd(pos) {
        return pos + 1 < this.end
            && this.text.charCodeAt(pos) === 42
            && this.text.charCodeAt(pos + 1) === 47;
    }
    scanHashCommentTrivia(skip) {
        ++this.pos;
        const start = this.pos;
        while (this.pos < this.end && !isLineBreak(this.text.charCodeAt(this.pos)))
            this.pos++;
        return skip ? undefined : this.text.substring(start, this.pos);
    }
    scanSingleLineCommentTrivia(skip) {
        this.pos += 2;
        const start = this.pos;
        while (this.pos < this.end && !isLineBreak(this.text.charCodeAt(this.pos)))
            this.pos++;
        return skip ? undefined : this.text.substring(start, this.pos);
    }
    scanMultiLineCommentTrivia(skip) {
        this.pos += 2;
        const start = this.pos;
        while (this.pos < this.end && !this.isAtMultiLineCommentEnd(this.pos))
            this.pos++;
        const commentEnd = this.pos;
        if (this.isAtMultiLineCommentEnd(this.pos)) {
            this.pos += 2;
        }
        return skip ? undefined : this.text.substring(start, commentEnd);
    }
    scanHtml() {
        const htmlOpen = this.text.charCodeAt(this.pos);
        this.pos++;
        let result = "";
        let start = this.pos;
        let subTagsLevel = 0;
        while (true) {
            if (this.pos >= this.end) {
                result += this.text.substring(start, this.pos);
                this.tokenFlags |= 2;
                this.isUnterminated = true;
                this.error("Unterminated html literal", 1);
                break;
            }
            const ch = this.text.charCodeAt(this.pos);
            if (ch === 60) {
                ++subTagsLevel;
                this.pos++;
                continue;
            }
            if (ch === 62) {
                this.pos++;
                console.assert(subTagsLevel >= 0);
                if (subTagsLevel === 0) {
                    result += this.text.substring(start, this.pos);
                    break;
                }
                else {
                    --subTagsLevel;
                    continue;
                }
            }
            this.pos++;
        }
        return result;
    }
    scanString(allowEscapes = true) {
        const quote = this.text.charCodeAt(this.pos);
        this.pos++;
        let result = "";
        let start = this.pos;
        let hasBackslash = false;
        while (true) {
            if (this.pos >= this.end) {
                result += this.text.substring(start, this.pos);
                this.tokenFlags |= 2;
                this.isUnterminated = true;
                this.error("Unterminated string", 1);
                break;
            }
            const ch = this.text.charCodeAt(this.pos);
            if (ch === 92) {
                hasBackslash = true;
            }
            else {
                if (hasBackslash) {
                    hasBackslash = false;
                }
                else {
                    if (ch === quote) {
                        result += this.text.substring(start, this.pos);
                        this.pos++;
                        break;
                    }
                    else if (isLineBreak(ch)) {
                        result += this.text.substring(start, this.pos);
                        this.tokenFlags |= 2;
                        this.isUnterminated = true;
                        this.error("Unterminated string", 1);
                        break;
                    }
                }
            }
            this.pos++;
        }
        const removedEscapes = result
            .replace(/\\"/g, '"')
            .replace(/\\(\r?\n)/g, '$1');
        return removedEscapes;
    }
    scanNumber() {
        let result = "";
        let hadDot = false;
        let hadMinus = false;
        const start = this.pos;
        while (true) {
            const ch = this.text.charCodeAt(this.pos);
            switch (ch) {
                case 48:
                case 49:
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56:
                case 57:
                    break;
                case 46:
                    if (hadDot) {
                        result += this.text.substring(start, this.pos);
                        return result;
                    }
                    hadDot = true;
                    hadMinus = true;
                    break;
                case 45:
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
    getIdentifierToken(tokenValue) {
        const len = tokenValue.length;
        if (len >= 4 && len <= 8) {
            const ch = tokenValue.charCodeAt(0);
            if ((ch >= 97 && ch <= 122)
                || (ch >= 65 && ch <= 90)) {
                const lowerCaseToken = tokenValue.toLowerCase();
                const t = textToToken.get(lowerCaseToken);
                if (t !== undefined) {
                    this.token = t;
                    return t;
                }
            }
        }
        return this.token = types_1.SyntaxKind.TextIdentifier;
    }
    lookAhead(callback) {
        return this.speculationHelper(callback, true);
    }
    tryScan(callback) {
        return this.speculationHelper(callback, false);
    }
    speculationHelper(callback, isLookahead) {
        const savePos = this.pos;
        const saveStartPos = this.startPos;
        const saveTokenPos = this.tokenPos;
        const saveToken = this.token;
        const saveTokenValue = this.tokenValue;
        const saveTokenFlags = this.tokenFlags;
        const result = callback();
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
exports.DefaultScanner = DefaultScanner;
function isIdentifierPartOf(ch, idType) {
    switch (idType) {
        case types_1.SyntaxKind.TextIdentifier:
            return ch === 95
                || 65 <= ch && ch <= 90
                || 97 <= ch && ch <= 122
                || 48 <= ch && ch <= 57;
        case types_1.SyntaxKind.HtmlIdentifier:
            return ch === 95
                || ch === 60
                || ch === 61
                || ch === 34
                || 65 <= ch && ch <= 90
                || 97 <= ch && ch <= 122
                || 48 <= ch && ch <= 57;
        case types_1.SyntaxKind.StringLiteral:
            return ch === 95
                || ch === 92
                || ch === 60
                || ch === 61
                || ch === 34
                || 65 <= ch && ch <= 90
                || 97 <= ch && ch <= 122
                || 48 <= ch && ch <= 57;
        case types_1.SyntaxKind.NumericIdentifier:
            return ch === 45
                || ch === 46
                || 48 <= ch && ch <= 57;
        default: throw "Invalid id type: " + idType;
    }
}
function getIdentifierStart(ch) {
    if (ch === 60)
        return types_1.SyntaxKind.HtmlIdentifier;
    if (ch === 34)
        return types_1.SyntaxKind.StringLiteral;
    if (ch === 95
        || 65 <= ch && ch <= 90
        || 97 <= ch && ch <= 122)
        return types_1.SyntaxKind.TextIdentifier;
    if (ch === 45
        || ch === 46
        || 48 <= ch && ch <= 57)
        return types_1.SyntaxKind.NumericIdentifier;
    return undefined;
}
function isIdentifierStart(ch) {
    return ch >= 65 && ch <= 90
        || ch >= 97 && ch <= 122
        || ch >= 48 && ch <= 57
        || ch === 95
        || ch === 60
        || ch === 34;
}
exports.isIdentifierStart = isIdentifierStart;
function isIdentifierPart(ch) {
    return ch >= 65 && ch <= 90
        || ch >= 97 && ch <= 122
        || ch >= 48 && ch <= 57
        || ch === 36
        || ch === 95
        || ch > 127;
}
function skipTrivia(text, pos) {
    while (true) {
        const ch = text.charCodeAt(pos);
        switch (ch) {
            case 13:
                if (text.charCodeAt(pos + 1) === 10)
                    ++pos;
                continue;
            case 10:
            case 9:
            case 11:
            case 12:
            case 32:
                ++pos;
                continue;
            case 35: {
                ++pos;
                while (pos < text.length) {
                    if (isLineBreak(text.charCodeAt(pos)))
                        break;
                    ++pos;
                }
                continue;
            }
            case 47:
                if (pos + 1 < text.length) {
                    const nextChar = text.charCodeAt(pos + 1);
                    switch (nextChar) {
                        case 47: {
                            pos += 2;
                            while (pos < text.length) {
                                if (isLineBreak(text.charCodeAt(pos)))
                                    break;
                                ++pos;
                            }
                            continue;
                        }
                        case 42: {
                            pos += 2;
                            while (pos < text.length) {
                                if (text.charCodeAt(pos) === 42 && text.charCodeAt(pos + 1) === 47) {
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
exports.skipTrivia = skipTrivia;
function isLineBreak(ch) {
    return ch === 10
        || ch === 13;
}
exports.isLineBreak = isLineBreak;
//# sourceMappingURL=scanner.js.map