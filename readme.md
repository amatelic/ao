# OA

 Libary for easier construction interaction with ollama. 

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

## Source

This are utility functions for importing data to prompts.

right now we support this sources

- search (get multiple links related to the query uses ollama api)
- web (get single webstei with ollama api)
- csv (support for importing csv file to prompts)
- generateText (helper function for generating random text)

## Ollamasearch

when accesing ollama search you need to provide the ollama api key for it to work.
You can generate the key at [ollama.ai](https://ollama.com/settings/keys)

```
OLLAMA_KEY=91111...
```


## Learning resources

- How do i improve the momory functionality
  - Should i on every interaction store the data and optimize the response with an llm.
    - 5 answers -> LMM please make the answers more compact??


- [Template literals (Template strings)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
