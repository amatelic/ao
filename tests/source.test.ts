import {
  expect,
  test,
  describe,
  afterEach,
  assert,
  beforeEach,
  vi,
} from "vitest";
import { search, web, web_custom, csv } from "../src/source";
import { pipe } from "../src/utils";
import { oa } from "../src/index";
import fs from "fs/promises";
import * as z from "zod";

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
    const siteContent = await web_custom(url);
    expect(siteContent.data).toEqual(`${data.title}\n\n${data.description}`);
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
    const data = await pipe(
      Promise.resolve({
        data: file,
        type: "text",
      }),
      [
        prompt(
          "Extract all numbers and sum them up. Give only the final sum without an explanation.",
        ),
      ],
    );

    expect(data?.message.content).toBe("12");
  });
  test("Check that the pipe sourcing works correctly", async () => {
    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
    });

    const result = JSON.stringify({
      volume: [153.23, 98.45],
    });

    const schema = z.object({
      volume: z.array(z.number()).describe("Collection of volume data"),
    });

    // we send the file because we can't mock the fetch
    const data = await pipe(csv(`${process.cwd()}/tests/assets/ticker.csv`), [
      prompt("Get the volumne of the tickers. Give me the data in json").format(
        schema,
      ),
    ]);
    const parseData = JSON.stringify(JSON.parse(data?.message.content));
    expect(parseData).toEqual(result);
  });
});

describe("Check ollama search is working", () => {
  test("Check if source is working", async () => {
    const { prompt } = await oa({
      model: "qwen2.5-coder:7b",
      stream: false,
    });
    const url = "https://gdo-studio.si";
    const data = await pipe(search(url), [
      prompt("Summarize the content of the website in a few words."),
    ]);
    expect(data).not.toBeNull();
  });
  test("Check that the pipe sourcing throws a error", async () => {
    const url = "https://gdo-studio.si";
    vi.stubEnv("OLLAMA_API_KEY", "");
    await expect(search(url)).rejects.toThrowError();
  });
});
