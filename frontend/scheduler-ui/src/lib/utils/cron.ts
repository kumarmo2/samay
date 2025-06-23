
import { isDigit } from ".";
import type { Result } from "./result";

export enum TokenType {
    Number,
    Star,
    Slash,
    Dash,
}

export type Token = {
    type: TokenType,
    value?: number | string,
}

export type CronPartType = "minute" | "hour" | "day" | "month" | "week"


/// returns a humar readable string if the cron expression is valid
export const cronParser = (cron: string): Result<string, string> => {
    const tokensResult = cronLexer(cron);
    if (tokensResult.type !== "ok") {
        return { type: 'err', val: tokensResult.val }
    }

    const tokens = tokensResult.val;
    const minuteTokens = tokens[0];

    var minutePartValidationResult = validateMinutePart(minuteTokens);
    if (minutePartValidationResult.type !== "ok") {
        return { type: 'err', val: minutePartValidationResult.val }
    }

    const hourTokens = tokens[1];
    var hourPartValidationResult = validateHourPart(hourTokens);
    if (hourPartValidationResult.type !== "ok") {
        return { type: 'err', val: hourPartValidationResult.val }
    }

    return { type: 'ok', val: "TODO: implement human readable string" }

}

const validateHourPart = (tokens: Token[]): Result<void, string> => {
    if (tokens.length === 0) {
        return { type: 'err', val: "hour part is required" }
    }
    if (tokens.length > 1) {
        return { type: 'err', val: "hour part can only have one value" }
    }

    const token = tokens[0];
    if (token.type === TokenType.Star) {
        return { type: 'ok', val: undefined }
    }
    if (token.type === TokenType.Number) {
        const n = +(token.value as number);
        if (n < 0 || n > 23) {
            return { type: 'err', val: "hour part must be between 0 and 23" }
        }
        return { type: 'ok', val: undefined }
    }

    return { type: 'err', val: `unknown token type: ${token.type}, value: ${token.value}` }
}

const validateMinutePart = (tokens: Token[]): Result<void, string> => {
    if (tokens.length === 0) {
        return { type: 'err', val: "minute part is required" }
    }

    if (tokens.length > 1) {
        return { type: 'err', val: "minute part can only have one value" }
    }

    const token = tokens[0];
    if (token.type === TokenType.Star) {
        return { type: 'ok', val: undefined }
    }
    if (token.type === TokenType.Number) {
        const n = +(token.value as number);
        if (n < 0 || n > 59) {
            return { type: 'err', val: "minute part must be between 0 and 59" }
        }
        return { type: 'ok', val: undefined }
    }

    return { type: 'err', val: `unknown token type: ${token.type}, value: ${token.value}` }
}



export const cronLexer = (cron: string): Result<Token[][], string> => {
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
            } else {
                return { type: 'err', val: `unknown character found: ${c}` }
            }
        }
        expressionParts.push(tokens);
    }
    return { type: 'ok', val: expressionParts }
}







