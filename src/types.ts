import { AbortableAsyncIterator, ChatResponse, Tool } from "ollama";
import z from "zod";
import { Prompt } from "./prompt";

export const ollamUrl = "http://localhost:11434/";

export const ollamaStreamSchema = z.object({
  url: z.url().default(ollamUrl).optional(),
  model: z.string(),
  stream: z.literal(true),
  tools: z.array(z.any()).optional(),
});

export const ollamaSchema = z.object({
  url: z.url().default(ollamUrl).optional(),
  model: z.string(),
  stream: z.literal(false),
  tools: z.array(z.any()).optional(),
});

export const OllamaOptionsSchema = z.union([ollamaStreamSchema, ollamaSchema]);

export type OllamaSchemaParams = z.infer<typeof OllamaOptionsSchema>;

export interface ToolCalls {
  tools: Tool[];
  exec: {
    [toolName: string]: (args: any) => Promise<string>;
  };
}

export type ToolType = (
  toolPrompt: any,
  // toolPrompt: ReturnType<ReturnType<typeof oa>["prompt"]>,
) => Promise<ChatResponse>;

// Helper type to extract the return type based on the stream property
export type ChatReturnType<T extends { stream?: boolean }> = T extends {
  stream: true;
}
  ? AbortableAsyncIterator<ChatResponse>
  : ChatResponse;

export type PromptInstance<
  T extends { stream?: boolean } = { stream?: boolean },
> = InstanceType<typeof Prompt<T & { model: string }>>;
