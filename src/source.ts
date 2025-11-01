import { htmlToText } from "html-to-text";
import { CsvParser } from "./helpers/csv-parser";
import { sourceTypes } from "./utils";

type SourceResult = {
  type: sourceTypes;
  data: string;
};

export const web = async (
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
