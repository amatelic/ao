import { expect, test, describe, afterEach, assert } from "vitest";
import * as z from "zod";
import { oa } from "../src";

describe("Check if formating is working", () => {
  test("Can read invoice data", async () => {
    const { prompt } = await oa({
      model: "magistral:latest",
      stream: false,
    });

    const schema = z.object({
      name: z.string().describe("Name of the president"),
      born: z.string().describe("Date of birth of the president"),
      description: z
        .string()
        .describe("Short history of the life of the president"),
    });

    const data = await prompt(
      "Tell me who is the 45 president of the united state",
    )
      .format(schema)
      .call();

    console.log(data.message.content);
  });
});
