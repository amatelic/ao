# OA

This is a libary for easier construction of LLM prompts with ollama.
The libary has some utility function which help with the construction of different prompts

## Basic prompt with the libary

```js
import { oa } from "@amatelic/oa";

async function main() {
  const { prompt } = await oa({
    model: "qwen2.5vl:3b",
    stream: true,
  });

  const iterator = await prompt("What is the capital of Slovenia?").call();

  for await (const part of iterator) {
    console.log(part);
  }
}

// non streaming version
async function main() {
  const { prompt } = await oa({
    model: "qwen2.5vl:3b",
    stream: false,
  });

  const prompt = await prompt("What is the capital of Slovenia?").call();
  console.log(promptConfig.message.content));
}

main()

```

## Example for calling tools

```js
const { tool, prompt } = await oa({
  ...config,
  model: "qwen3:4b",
  stream: false,
});

const weatherTool = {
  type: "string",
  function: {
    name: "weather",
    description: "Get the weather for a given city",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "The city to get the weather for",
        },
      },
      required: ["city"],
    },
  },
};

const weatherToolPrompt = tool({
  tools: [weatherTool],
  exec: {
    [weatherTool.function.name]: (args: { city: string }) => {
      return Promise.resolve(args.city);
    },
  },
});

const response = await weatherToolPrompt(
  prompt("Get the weather for New York"),
);
console.log(response.message.content) // "New York"
```


## Learning resources

- [Template literals (Template strings)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
