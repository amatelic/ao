# AO

Libary for easier construction of LLM prompts with ollama.

Basic example:

```js
import { oa } from "@amatelic/oa";


async function main() {
  const { prompt } = await oa({
    model: "qwen2.5vl:3b",
    stream: false,
  });

  const prompt = await prompt("What is the capital of Slovenia?").call();
  console.log(promptConfig.message.content));
}

main()

``


# Learning resources

- [Template literals (Template strings)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
