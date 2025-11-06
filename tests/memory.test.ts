import { describe, test, expect } from "vitest";
import { memo } from "../src/utils";
import { oa } from "../src";

describe("Check if memory history is working correctly", () => {
  test("Check that the pg is working correctyl", async () => {
    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
      options: {
        num_ctx: 8192,
      },
    });

    const storyMemory = memo();

    const data = await storyMemory.ask(prompt("What is  2 + 2"));

    expect(storyMemory.list().length).toBe(2);
  });

  test("Check how good he remembers stuff", async () => {
    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
      options: {
        num_ctx: 8192,
      },
    });

    const storyMemory = memo();

    await storyMemory.ask(prompt("What is  2 + 2"));

    await storyMemory.ask(prompt("What is 5 + 5"));

    const value = await storyMemory.ask(
      prompt("what was the answer for the first question?"),
    );

    expect(value.message.content).includes("4");
    expect(storyMemory.list().length).toBe(6);
  });
});
