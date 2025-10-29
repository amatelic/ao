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

    const prompt1 = prompt("Tool for fetching food service");
    const prompt2 = prompt("Tool for fetching best places to stay");
    const prompt3 = prompt("How do i make an airpalane");

    const routerCall = router([prompt1, prompt2, prompt3]);

    const response = await routerCall(
      "I want to plan a trip to New York. I will stay in a hotel near the Central Park.",
    );

    expect(response.length).toBe(1);

    expect(response[0].prompt).toBe(prompt2.prompt);
  });
  test("Fork task for travel/food (get both)", async () => {
    const { router, prompt } = await oa({
      ...config,
      model: "qwen2.5-coder:7b",
      stream: false,
    });

    const prompt1 = prompt("Tool for fetching food service");
    const prompt2 = prompt("Tool for fetching best places to stay");

    const routerCall = router([prompt1, prompt2]);

    const response = await routerCall(
      "I want to plan a trip to New York in a hotel. Plus i want to try some good asian food",
    );

    expect(response.length).toBe(2);

    expect(response[0].prompt).toBe(prompt1.prompt);
    expect(response[1].prompt).toBe(prompt2.prompt);
  });
});
