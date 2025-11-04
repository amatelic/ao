import { expect, test, describe, afterEach, assert } from "vitest";
import fs from "fs/promises";

import { oa } from "../src";

// Test for prompt which select correct sub child prompt
// there is posibility to select multiple options
describe("Check for image support", () => {
  test("Can read invoice data", async () => {
    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
    });

    const file = await fs.readFile(
      `${process.cwd()}/tests/assets/batch1-0001.jpg`,
    );

    // const data = Buffer.from(file).toString("base64");

    const readTheInvoice = prompt(
      "Read the invoice data and return json data",
    ).addImage(file);

    const response = await readTheInvoice.call();

    // only check if the response return correct invoice number
    expect(response.message.content).includes("51109338");
  });
});
