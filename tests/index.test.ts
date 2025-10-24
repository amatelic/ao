import { expect, test, describe } from "vitest";
import { createServer } from "node:http";

import { oa } from "../src";
import { after } from "node:test";
import { ChatResponse } from "ollama";

const PORT = 500;
const url = `http://localhost:${PORT}/`;

export function createLocalServer(port = 0, message = "") {
  const server = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/text" });
      res.end(message);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  return { server, port };
}

class UtilTestingServer {
  static async serverMessage(message = "") {
    const { server, port } = createLocalServer(PORT, message);
    server.listen(port);
    await new Promise((resolve) => server.once("listening", resolve));

    after(() => {
      server.close(); // Shut down the server after tests
    });
  }
}

const config = {
  model: "qwen2.5-coder:7b",
  stream: true,
};

describe("Make basi ai example", () => {
  test("should fail to connect", async () => {
    expect(
      oa({
        ...config,
        url: "http://localhost:34355",
      }),
    ).rejects.toThrow("fetch failed");
  });

  test("should check if ollama is running", async () => {
    await UtilTestingServer.serverMessage("Ngnix server");
    expect(
      oa({
        ...config,
        url: url,
      }),
    ).rejects.toThrow("Failed to connect to Ollama server");
  });

  test("create basic prompt (streaming)", async () => {
    const { prompt } = await oa({
      ...config,
    });

    const whatIs2by2 = await prompt(
      "I want to know how much is 2 + 2? Return the number only without any other explanation",
    ).call();

    const chunks: ChatResponse[] = [];
    for await (const part of whatIs2by2) {
      chunks.push(part);
    }

    expect(chunks[0].message.content).toBe("4");
  });

  test("create basic prompt", async () => {
    const { prompt } = await oa({
      ...config,
      stream: false,
    });

    const whatIs2by2 = await prompt(
      "I want to know how much is 2 + 2? Return the number only without any other explanation",
    ).call();

    expect(whatIs2by2.message.content).toBe("4");
  });

  test("task prompt", async () => {
    const { prompt, tool } = await oa({
      ...config,
      stream: false,
    });
    expect(response.message.content).toBe("4");
  });
});
