import { htmlToText } from "html-to-text";

export const web = async (url: string, options = {}, timeoutMs = 15000) => {
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
    return htmlToText(text, { uppercase: false });
  } finally {
    clearTimeout(id);
  }
};
