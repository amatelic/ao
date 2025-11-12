import ollama, { ChatRequest, Message } from "ollama";
import {
  ChatReturnType,
  OllamaOptionsSchema,
  OllamaSchemaParams,
} from "./types/types";
import * as z from "zod";
import { $ZodType, JSONSchema } from "zod/v4/core";

export class Prompt<T extends { stream?: boolean; model: string }> {
  id: string;
  prompt: string;
  config: T;
  images: (string | Buffer)[];
  private _think: boolean | "high" | "medium" | "low";
  private schema?: JSONSchema.BaseSchema;
  private source?: string;
  private stop: string[];
  private prefix: string = "";
  private postfix: string = "";

  constructor(prompt: string, config: T) {
    this.prompt = prompt;
    this.config = config;
    this.id = crypto.randomUUID();
    this.images = [];
    this.stop = [];
    this._think = false;
  }

  setConfig(config: Partial<OllamaSchemaParams>, merge = false) {
    const parsed = OllamaOptionsSchema.parse(
      merge ? { ...this.config, ...config } : config,
    );
    this.config = { ...this.config, ...parsed } as T;
    return this;
  }

  think(think: boolean | "high" | "medium" | "low") {
    this._think = think;
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

  addPrefix(prefix: string) {
    this.prefix = `${prefix} `;
    return this;
  }

  setPrompt(prompt: string) {
    this.prompt = prompt;
    return this;
  }

  addPostfix(prefix: string) {
    this.postfix = `${prefix} `;
    return this;
  }
  createMessage(): ChatRequest {
    const message = this.source
      ? [
          {
            role: "user",
            content: this.source,
          },
        ]
      : [];
    let config = Object.assign({}, this.config, {
      options: { stop: this.stop },
    });

    return {
      ...config,
      stream: this.config.stream ?? false,
      format: this.schema,
      think: this._think,
      messages: [
        ...message,
        {
          role: "user",
          content: `${this.prefix}${this.prompt}${this.postfix}`,
          images: this.images.length > 0 ? (this.images as any) : undefined,
        },
      ],
    };
  }
  // })
  private async _callWithHistory(
    messages: Message[],
  ): Promise<ChatReturnType<T>> {
    let config = Object.assign({}, this.config, {
      options: { stop: this.stop },
    });

    const configMessage = {
      ...config,
      stream: this.config.stream ?? false,
      format: this.schema,
      think: this._think,
      messages: messages,
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

  async call(): Promise<ChatReturnType<T>> {
    const configMessage = this.createMessage();
    // Runtime dispatch based on stream value
    if (configMessage.stream) {
      const result = await ollama.chat({
        ...configMessage,
        think: false,
        stream: true,
      });
      return result as ChatReturnType<T>;
    } else {
      const result = await ollama.chat({
        ...configMessage,
        think: false,
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
