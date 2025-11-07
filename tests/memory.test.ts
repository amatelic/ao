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

  test("Check how good he remembers stuff", async () => {
    const { prompt } = await oa({
      model: "magistral",
      stream: false,
      options: {
        num_ctx: 8192,
      },
    });

    const storyMemory = memo(
      prompt(`
        You are agent for giving recommendations related to the inputs from the user.

        User input:
        - i am an introvert

        User input:
        - give me some good books to read

        Assistant:
          since you are an introvert this books should be interesting to you
            -Why Has Nobody Told Me This Before?
            -The Introvert’s Way: Living a Quiet Life in a Noisy World
        `),
    );

    storyMemory.addMemory(prompt("Hey most of the time i am an introvert"));

    storyMemory.addMemory(
      prompt("when i was younger i was younger i trained aikido and drawing"),
    );

    const chatAnswer1 = await storyMemory.ask(prompt("what is 1 + 1"));

    const value = await storyMemory.ask(
      prompt(
        "Do you have any good recommendation for me on how to become better at sales",
      ),
    );

    expect(chatAnswer1.message.content).includes("2");
    expect(value.message.content).includes("introvert");
  });
});
