import ollama, {
  AbortableAsyncIterator,
  ChatRequest,
  ChatResponse,
  Tool,
} from "ollama";

import z from "zod";

const defaultModels = ["llama3.1", "mistral", "devstral"] as const;

const ollamaSchema = z.object({
  url: z.url().default("http://localhost:11434/").optional(),
  model: z.string(),
  stream: z.boolean().default(false),
  // options?: Par
});

type OllamaSchemaParams = z.infer<typeof ollamaSchema>;

// const response = await ollama.chat({
//   model: "llama3.1",
//   messages: [{ role: "user", content: "Why is the sky blue?" }],
// });

// ollam
const url = "http://localhost:11434/";

export type PromptFunction = (
  literals: TemplateStringsArray,
  ...placeholders: any[]
) => Promise<AbortableAsyncIterator<ChatResponse>>;

export async function oa(args: OllamaSchemaParams) {
  const config = await ollamaSchema.parseAsync(args);
  // basic check if ollama is running
  const response = await fetch(config.url as string);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  if (!text.includes("Ollama is running")) {
    throw new Error(`Failed to connect to Ollama server`);
  }

  const system = async (strings: any, ...values: any[]) => {};

  const extract = (strings: any, values: any[]) => {
    let query = strings[0];
    const params = [];
    for (let i = 0; i < values.length; i++) {
      query += `$${i + 1}` + strings[i + 1];
      params.push(values[i]);
    }

    return { query, params };
  };

  const defaultChatConfig = {
    model: config.model,
    stream: config.stream as false,
    think: false,
    options: {
      num_ctx: 2048,
      temperature: 0,
    },
  } as ChatRequest;

  interface PP {
    prompt: String;
    config: any;
  }

  let count = 1;

  class Prompt {
    prompt: String;
    config: any;
    count: number;
    images: (string | Buffer)[];

    constructor(prompt: string) {
      this.prompt = prompt;
      this.config = Object.assign({}, defaultChatConfig);
      this.count = count++;
      this.images = [];
    }

    setConfig(config: ChatRequest, merge = false) {
      if (merge) {
        this.config = { ...this.config, ...config };
      } else {
        this.config = config;
      }
      return this;
    }

    addImage(image: string | Buffer) {
      if (image) {
        this.images.push(image);
      }
      return this;
    }

    async call() {
      const configMessage = {
        ...(this.config as any),
        messages: [
          {
            role: "user",
            content: this.prompt,
            images: this.images.length > 0 ? this.images : undefined,
          },
        ],
      };
      console.log(configMessage);
      return ollama.chat(configMessage);
    }
    get promptId(): string {
      return `prompt-${this.count}`;
    }
  }

  // change to function but add new functionality
  function prompt(prompt: string): Prompt {
    return new Prompt(prompt);
  }

  interface ToolCalls {
    tools: Tool[];
    exec: {
      [toolName: string]: (args: any) => Promise<string>;
    };
  }

  type ToolType = (promptString: any) => Promise<ChatResponse>;

  const tool = (tool: ToolCalls): ToolType => {
    const newConfig = {
      ...defaultChatConfig,
      stream: false,
      tools: tool.tools,
    } as ChatRequest;

    return async (toolPrompt: Prompt) => {
      const response: any = await toolPrompt.setConfig(newConfig).call();
      return new Promise(async (resolve, reject) => {
        if (response.message.tool_calls) {
          const toolCalls = response.message.tool_calls;
          const toolName = toolCalls[0].function.name;
          const toolArgs = toolCalls[0].function.arguments;

          const result = await tool.exec[toolName](toolArgs);

          response.message = {
            content: result,
            role: "assistant",
          };
          return resolve(response);
        }
        // return not tool
        response.message.content = "not tool";
        resolve(response);
      });
    };
  };

  const router = (prompts: Prompt[]) => {
    const generateText = prompts
      .map((prompt) => {
        return `prompt-id: ${prompt.promptId}. Prompt description: ${prompt.prompt}`;
      })
      .join("\n");

    const command = `
      You are an routing service bot. Your task is to select the correct propt-id to execute. All avaialable propts ids are defined below. Your job is to select all the propts which are required from you from the user :\n
      All available prompts ids with the prompt description are provided here:\n

      ${generateText}


      If the text doesn't fit into any of the above task ids, classify it as: none.
      Dont provide any comments or explanation only provide the correct prompt-id or none in case there is not prompt-if for the user input.

      Example of output can be seen below:\n
      none
      prompt-1
      prompt-1,prompt-2
      prompt-1,prompt-3,prompt-2
      prompt-1,prompt-4,prompt-2,prompt-3
      ### Here is the user examples:\n
    `;

    const newConfig = {
      ...defaultChatConfig,
      stream: false,
      think: false,
    } as ChatRequest;

    return (userPrompt: string) => {
      // console.log("[TEST]", `${command} <<<${userPrompt}>>>`);
      return prompt(`${command} <<<${userPrompt}>>>`)
        .setConfig(newConfig)
        .call();
    };
  };

  return {
    prompt,
    tool,
    router,
    config: Object.assign({}, defaultChatConfig),
  };
}

// condition types
// fork
// paralel
// sequencial
//
//
// utils type
// json
// markdown
