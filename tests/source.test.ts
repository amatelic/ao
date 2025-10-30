import {
  expect,
  test,
  describe,
  afterEach,
  assert,
  beforeEach,
  vi,
} from "vitest";
import { web } from "../src/source";
import { pipe } from "../src/utils";
import { oa } from "../src/index";
import fs from "fs/promises";

describe("Check if sources are working", () => {
  beforeEach(() => {
    // Clear mock before each test
    vi.clearAllMocks();
  });
  afterEach(() => {
    // Restore original fetch after tests
    vi.unstubAllGlobals();
  });

  test("Check that web source is fetch correctly", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const data = {
      title: "HELLO EXAMPLE",
      description: "basic test pages",
    };

    const text = `<h1>${data.title}</h1><p>${data.description}</p>`;

    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test data" }),
      text: () => Promise.resolve(text),
    };

    // Mock the fetch response
    (fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);
    const url = "https://example.com";
    const siteContent = await web(url);
    expect(siteContent).toEqual(`${data.title}\n\n${data.description}`);
  });

  test("Check that the pipe sourcing works correctly", async () => {
    const file = await fs.readFile(
      `${process.cwd()}/tests/assets/number-site.html`,
      "utf-8",
    );

    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
    });

    // we send the file because we can't mock the fetch
    const data = await pipe(Promise.resolve(file), [
      prompt(
        "Extract all numbers and sum them up. Give only the final sum without an explanation.",
      ),
    ]);

    expect(data?.message.content).toBe("12");
  });

  // const siteContent = await web(url).pipe((content) => content.toUpperCase());
  // console.log(siteContent);
  // expect(siteContent).toEqual(`${data.title.toUpperCase()}\n\n${data.description.toUpperCase()}`);
});
