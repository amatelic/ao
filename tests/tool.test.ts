import { expect, test, describe, afterEach, assert } from "vitest";
import { createServer } from "node:http";

import { oa } from "../src";

const config = {
  model: "qwen2.5-coder:7b",
  stream: true,
};

describe("Check that tool commands are working", () => {
  test("Calls the weather tool", async () => {
    const { tool, prompt } = await oa({
      ...config,
      model: "qwen3:4b",
      stream: false,
    });

    const weatherTool = {
      type: "string",
      function: {
        name: "weather",
        description: "Get the weather for a given city",
        parameters: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "The city to get the weather for",
            },
          },
          required: ["city"],
        },
      },
    };

    const weatherToolPrompt = tool({
      tools: [weatherTool],
      exec: {
        [weatherTool.function.name]: (args: { city: string }) => {
          return Promise.resolve(args.city);
        },
      },
    });

    const response = await weatherToolPrompt(
      prompt("Get the weather for New York"),
    );
    expect(response.message.content).toBe("New York");
  });
});
