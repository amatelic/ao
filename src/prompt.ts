import ollama, { ChatRequest } from "ollama";
import {
  ChatReturnType,
  OllamaOptionsSchema,
  OllamaSchemaParams,
} from "./types";

export class Prompt<T extends { stream?: boolean; model: string }> {
  id: string;
  prompt: string;
  config: T;
  images: (string | Buffer)[];

  constructor(prompt: string, config: T) {
    this.prompt = prompt;
    this.config = config;
    this.id = crypto.randomUUID();
    this.images = [];
  }

  setConfig(config: Partial<OllamaSchemaParams>, merge = false) {
    const parsed = OllamaOptionsSchema.parse(
      merge ? { ...this.config, ...config } : config,
    );
    this.config = { ...this.config, ...parsed } as T;
    return this;
  }

  addImage(image: string | Buffer) {
    if (image) {
      this.images.push(image);
    }
    return this;
  }
  // })
  async call(): Promise<ChatReturnType<T>> {
    const configMessage: ChatRequest = {
      ...this.config,
      stream: this.config.stream ?? false,
      messages: [
        {
          role: "user",
          content: this.prompt,
          images: this.images.length > 0 ? (this.images as any) : undefined,
        },
      ],
    };

    // Runtime dispatch based on stream value
    if (configMessage.stream) {
      const result = await ollama.chat({
        ...configMessage,
        stream: true,
      });
      return result as ChatReturnType<T>;
    } else {
      const result = await ollama.chat({
        ...configMessage,
        stream: false,
      });
      return result as ChatReturnType<T>;
    }
  }
  get promptId(): string {
    return `prompt-${this.id}`;
  }
}

// change to function but add new functionality
export function prompt<T extends ChatRequest, U extends { stream?: boolean }>(
  prompt: string,
  customConfig: T & U,
) {
  return new Prompt<T & U>(prompt, customConfig);
}
