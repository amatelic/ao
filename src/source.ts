import { htmlToText } from "html-to-text";
import { CsvParser } from "./helpers/csv-parser";
import { SourceResult } from "./utils";
import { PromptInstance } from "./types/types";
import { Ollama } from "ollama";

export const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

export const search = async (
  query: string,
  maxResults = 5,
): Promise<SourceResult> => {
  if (!process.env.OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY key not found");
  }
  return new Ollama({
    host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      "User-Agent": "Gdo studio/1.0",
    },
  })
    .webSearch({
      query,
      maxResults: maxResults,
    })
    .then((response) => {
      return {
        type: "text",
        data: JSON.stringify(response.results),
      };
    });
};

export const web = async (query: string): Promise<SourceResult> => {
  if (!process.env.OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY key not found");
  }
  return new Ollama({
    host: process.env.ollama_host || "http://127.0.0.1:11434",
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      "User-Agent": "Gdo studio/1.0",
    },
  })
    .webFetch({
      url: query,
    })
    .then((response) => {
      return {
        type: "text",
        data: JSON.stringify(response),
      };
    });
};

export const web_custom = async (
  url: string,
  options = {},
  timeoutMs = 15000,
): Promise<SourceResult> => {
  const controller = new AbortController();
  const id = setTimeout(
    () => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)),
    timeoutMs,
  );
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      type: "text",
      data: htmlToText(text, { uppercase: false }),
    };
  } finally {
    clearTimeout(id);
  }
};

export const csv = async (path: string): Promise<SourceResult> => {
  const parser = new CsvParser();
  const results: (string[] | Record<string, string>)[] = [];

  for await (const row of parser.parseFile(path)) {
    if (row) {
      results.push(row);
    }
  }

  return {
    type: "text",
    data: `Here you have a csv file with the below content\n ${results.join("\n")}`,
  };
};

export async function generateText(
  prompt: PromptInstance,
): Promise<SourceResult> {
  const response = await prompt.call();
  return {
    type: "text",
    data: response.message.content,
  };
}

export async function file(filePath: string): Promise<SourceResult> {
  if (!isNode) {
    throw new Error("File loading is only supported in Node.js");
  }

  const fs = await import("fs/promises");

  const response = await fs.readFile(filePath, "utf8");

  return {
    type: "text",
    data: response,
  };
}
