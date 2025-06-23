import { test, describe, expect } from "vitest";
import { cronLexer } from "./cron";

describe("CronExpression", () => {
    describe("Cron lexer", () => {
        test("it works cronLexer", () => {
            const cron = "* * * * *";
            const result = cronLexer(cron);
            expect(result.type).toBe('ok');
            if (result.type != 'ok') {
                throw new Error("not possible");
            }
            const tokens = result.val;
            console.log("tokens: ", tokens);
            expect(tokens).toHaveLength(5)
        });

        test("range in minutes cronLexer", () => {
            const cron = "5-10 * * * *";
            const result = cronLexer(cron);
            expect(result.type).toBe('ok')
            if (result.type != 'ok') {
                throw new Error("not possible");
            }
            const tokens = result.val;
            console.log("tokens: ", tokens);
            expect(tokens).toHaveLength(5)
            expect(tokens[0]).toHaveLength(3)
        })
    })

})
