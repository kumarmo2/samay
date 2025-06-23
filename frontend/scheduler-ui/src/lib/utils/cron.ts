
import { isDigit } from ".";

enum TokenType {
    Number,
    Star,
    Slash,
    Dash,
}

type Token = {
    type: TokenType,
    value?: number | string,
}


export const cronLexer = (cron: string) => {
    const expression = cron.trim();

    let i = 0;
    const n = expression.length;
    const expressionParts: Token[][] = [];

    while (i < n) {
        while (i < n && expression[i] === " ") { // TODO: handle whitespace
            i++;
        }
        if (i >= n) {
            break;
        }
        const tokens: Token[] = [];

        while (i < n && expression[i] !== " ") {
            const c = expression[i];
            if (c === "*") {
                tokens.push({ type: TokenType.Star });
                i++;
            } else if (c === "/") {
                tokens.push({ type: TokenType.Slash });
                i++;
            } else if (c === "-") {
                tokens.push({ type: TokenType.Dash });
                i++;
            } else if (isDigit(c)) {
                const start = i;
                while (i < n && isDigit(expression[i])) {
                    i++;
                }
                tokens.push({ type: TokenType.Number, value: +expression.slice(start, i) });
            }
        }
        expressionParts.push(tokens);
    }
    return expressionParts
}







