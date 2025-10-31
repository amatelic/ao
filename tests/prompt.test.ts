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

  test("Promprot stops working on codition", async () => {
    const { prompt, config } = await oa({
      ...globalonfig,
      stream: false,
    });

    const wihtouStopFunction = await prompt(
      "Count from 1 to 10 in one line whitout any other content",
    ).call();

    console.log(wihtouStopFunction.message.content);

    expect(wihtouStopFunction.message.content).contains("1 2 3 4 5 6 7 8 9 10");

    const withStopFunction = await prompt(
      "Count from 1 to 10 in one line whitout any other content",
    )
      .addStop("6")
      .call();

    console.log(withStopFunction.message.content);

    expect(withStopFunction.message.content).contains("1 2 3 4 5");
  });
});
