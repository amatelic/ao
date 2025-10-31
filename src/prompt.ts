import ollama, { ChatRequest } from "ollama";
import {
  ChatReturnType,
  OllamaOptionsSchema,
  OllamaSchemaParams,
} from "./types";
import * as z from "zod";
import { $ZodType, JSONSchema } from "zod/v4/core";

export class Prompt<T extends { stream?: boolean; model: string }> {
  id: string;
  prompt: string;
  config: T;
  images: (string | Buffer)[];
  schema?: JSONSchema.BaseSchema;
  source?: string;
  stop: string[];

  constructor(prompt: string, config: T) {
    this.prompt = prompt;
    this.config = config;
    this.id = crypto.randomUUID();
    this.images = [];
    this.stop = [];
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
  addSource(source: string) {
    this.source = source;
    return this;
  }
  addStop(stop: string) {
    if (stop) {
      this.stop.push(stop);
    }
    return this;
  }
  // })
  async call(): Promise<ChatReturnType<T>> {
    const message = this.source ? [{ role: "user", content: this.source }] : [];

    let config = Object.assign({}, this.config, {
      options: { stop: this.stop },
    });
    const configMessage: ChatRequest = {
      ...config,
      stream: this.config.stream ?? false,
      format: this.schema,
      messages: [
        ...message,
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
  format(schema: $ZodType) {
    this.schema = z.toJSONSchema(schema);
    return this;
  }
}

// change to function but add new functionality
export function prompt<T extends ChatRequest, U extends { stream?: boolean }>(
  prompt: string,
  customConfig: T & U,
) {
  return new Prompt<T & U>(prompt, customConfig);
}
