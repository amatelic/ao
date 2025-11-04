import { expect, test, describe, afterEach, assert } from "vitest";
import * as z from "zod";
import { oa } from "../src";
import { pipe } from "../src/utils";
import { postgres } from "../src/plugins/postgres";

describe("Check different plugins", () => {
  test("Check that the pg is working correctyl", async () => {
    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
      options: {
        num_ctx: 8192,
      },
    });

    // const schema = z.object({
    //   name: z.string().describe("Name of the president"),
    //   born: z.string().describe("Date of birth of the president"),
    //   description: z
    //     .string()
    //     .describe("Short history of the life of the president"),
    // });

    const promisePool = postgres();

    const task = await pipe(promisePool(), [
      prompt("Get me all the events table from the provided database"),
    ]);

    console.log(task.message.content);
  });
});
