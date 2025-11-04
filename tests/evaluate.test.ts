import { expect, test, describe, afterEach, assert } from "vitest";
import * as z from "zod";
import { oa } from "../src";
import { pipe } from "../src/utils";
import fs from "node:fs/promises";
import { generateText } from "../src/source";

// Test for prompt which select correct sub child prompt
// there is posibility to select multiple options
describe("Evaluate the performance of a model", () => {
  test("Can read invoice data", async () => {
    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
    });

    const report = await fs.readFile(
      `${process.cwd()}/tests/assets/nvidia-report.md`,
      "utf-8",
    );

    const summaryPrompt = prompt(
      `Create a summary of the NVDIA financial report. Here is some data: ${report}`,
    );

    const schema = z.object({
      summaries: z.array(
        z
          .object({
            confidence: z
              .string()
              .describe("Confidnace of summary. The value is from 0 to 1"),
            text: z
              .string()
              .describe("Text which was used to get the confidence"),
          })
          .describe("List of all summaries"),
      ),
    });

    type SummaryOptions = z.infer<typeof schema>;

    const promptText = `
      '
      You are given an report and three summaries of the report. Evaluate the three summaries and rate which one you believe is the best.
      Explain your choice by pointing out specific reasons such as clarity, completeness, and relevance to the essay content.

      #Example:
      \`\`\`json
      { "summaries": [{ "confidence": 0.8, "summary": "NVIDIA is a leading GPU manufacturer."}]}',
      \`\`\`

      # Report:
      ${report}

      # Summaries
      `;

    const analysisPrompt = prompt(promptText).format(schema);

    const response = await pipe(generateText(summaryPrompt), [analysisPrompt]); // only check if the response return correct invoice number

    const data = JSON.parse(response.message.content) as SummaryOptions;

    console.log(data);

    expect(data.summaries.length).toBe(3);
  });
});
