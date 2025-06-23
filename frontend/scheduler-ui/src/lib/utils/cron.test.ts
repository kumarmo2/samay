import { test } from "vitest";
import { cronLexer } from "./cron";

test("cronLexer", () => {
    const cron = "0-10 * * * *";
    const tokens = cronLexer(cron);
    console.log(tokens);
})
