import { expect, test, describe, afterEach, assert } from "vitest";

import { oa } from "../src";
import { ChatRequest } from "ollama";

const globalonfig = {
  model: "qwen2.5-coder:7b",
  stream: true,
};

describe("Check case for prompts", () => {
  test("task prompt", async () => {
    const { prompt, config } = await oa({
      ...globalonfig,
      stream: false,
    });

    const configChat = {
      ...config,
      options: {
        num_ctx: 512,
        temperature: 0,
      },
    } as ChatRequest;

    // Edge cases yes or no
    // or Yes or No?
    const promptConfig = await prompt(
      "Is a cat an animal. Only return yes or no.",
    )
      .setConfig(configChat)
      .call();

    expect(promptConfig.message.content).contains("Yes");
  });
});
