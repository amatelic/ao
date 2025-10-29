import { prompt } from "./prompt";
import {
  OllamaOptionsSchema,
  ollamaSchema,
  OllamaSchemaParams,
  PromptInstance,
  ToolCalls,
} from "./types";
import { routerPrompts, tool } from "./utils";

export async function oa<T extends OllamaSchemaParams>(args: T) {
  const config = await OllamaOptionsSchema.parseAsync(args);
  // basic check if ollama is running
  const response = await fetch(config.url as string);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  if (!text.includes("Ollama is running")) {
    throw new Error(`Failed to connect to Ollama server`);
  }

  return {
    prompt: <U extends { stream?: boolean }>(
      promptStr: string,
      customConfig?: U,
    ) => {
      // Merge the base config with custom config
      const mergedConfig = {
        ...config,
        ...customConfig,
      } as T & U;

      return prompt<T, U>(promptStr, mergedConfig);
    },
    tool: <U extends { stream?: boolean }>(
      tools: ToolCalls,
      customConfig?: U,
    ) => {
      // Merge the base config with custom config
      const mergedConfig = {
        ...config,
        ...customConfig,
      } as T & U;

      return tool(tools, mergedConfig);
    },
    router: <U extends { stream?: boolean }>(routes: PromptInstance[]) => {
      // Merge the base config with custom config
      const mergedConfig = {
        ...config,
        stream: false,
      } as T & U;

      return async (userPrompt: string): Promise<PromptInstance[]> => {
        const instructions = routerPrompts(routes);
        const response = await prompt(
          `${instructions} <<<${userPrompt}>>>`,
          mergedConfig,
        ).call();

        const tasksIds = response.message.content
          .split(",")
          .reduce(
            (acc, item) => ({ ...acc, [item]: true }),
            {} as Record<string, boolean>,
          );

        return routes.filter((r) => {
          return tasksIds[r.promptId] || false;
        });
      };
    },
    config: { ...config },
  };
}
