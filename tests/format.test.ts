import { expect, test, describe, afterEach, assert } from "vitest";
import * as z from "zod";
import { oa } from "../src";

describe("Check if formating is working", () => {
  test("Can read invoice data", async () => {
    const { prompt } = await oa({
      model: "magistral",
      stream: false,
    });

    const schema = z.object({
      name: z.string().describe("Name of the president"),
      born: z.string().describe("Date of birth of the president"),
      description: z
        .string()
        .describe("Short history of the life of the president"),
    });
    
    type President = z.infer<typeof schema>;

    const data = await prompt(
      "Tell me who is the 45 president of the united state",
    )
      .format(schema)
      .call();

      const presidentData = JSON.parse(data.message.content) as President
      expect(presidentData.born).not.undefined
      expect(presidentData.description).not.undefined
      expect(presidentData.name).not.undefined
  });
});
