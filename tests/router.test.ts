import { expect, test, describe, afterEach, assert } from "vitest";

import { oa } from "../src";

const config = {
  model: "qwen2.5-coder:7b",
  stream: true,
};

// Test for prompt which select correct sub child prompt
// there is posibility to select multiple options
describe("Check if fork options works for app", () => {
  test("Forks task for travel get (get one)", async () => {
    const { router, prompt } = await oa({
      ...config,
      model: "qwen2.5-coder:7b",
      stream: false,
    });

    const routerCall = router([
      prompt("Tool for fetching food service"),
      prompt("Tool for fetching best places to stay"),
    ]);

    const response = await routerCall(
      "I want to plan a trip to New York. I will stay in a hotel near Central Park.",
    );

    expect(response.message.content).toBe("prompt-2");
  });
  test("Fork task for travel/food (get both)", async () => {
    const { router, prompt } = await oa({
      ...config,
      model: "qwen2.5-coder:7b",
      stream: false,
    });

    const routerCall = router([
      prompt("Tool for fetching food service"),
      prompt("Tool for fetching best places to stay"),
    ]);

    const response = await routerCall(
      "I want to plan a trip to New York in a hotel. Plus i want to try some good asian food",
    );

    expect(response.message.content).toBe("prompt-2,prompt-1");
  });
});
