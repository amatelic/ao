// condition types
// fork
// paralel
// sequencial
//
//
// utils type
// json

import { ChatResponse } from "ollama";
import {
  OllamaSchemaParams,
  PromptInstance,
  ToolCalls,
  ToolType,
} from "./types";
import { Prompt, prompt } from "./prompt";

export const tool = (
  toolConfig: ToolCalls,
  config: Partial<OllamaSchemaParams>,
): ToolType => {
  return async (toolPrompt: PromptInstance) => {
    // Set the tool configuration
    const toolPromptWithConfig = toolPrompt.setConfig(
      {
        ...config,
        stream: false,
        tools: toolConfig.tools,
      },
      true,
    ); // merge = true to preserve existing config

    // Call the prompt
    const response = (await toolPromptWithConfig.call()) as ChatResponse;

    // Handle tool calls
    try {
      if (response.message?.tool_calls) {
        const toolCalls = response.message.tool_calls;
        const toolName = toolCalls[0].function.name;
        const toolArgs = toolCalls[0].function.arguments;

        // Execute the tool
        const result = await toolConfig.exec[toolName](toolArgs);

        // Update response with tool result
        const updatedResponse: ChatResponse = {
          ...response,
          message: {
            content: result,
            role: "assistant",
          },
        };

        return updatedResponse;
      } else {
        // No tool calls, return original response with modified content
        const updatedResponse: ChatResponse = {
          ...response,
          message: {
            ...response.message,
            content: "not tool",
          },
        };
        return updatedResponse;
      }
    } catch (error) {
      throw new Error(
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
};

export const routerPrompts = (prompts: PromptInstance[]) => {
  const generateText = prompts
    .map((prompt) => {
      return `prompt-id: ${prompt.promptId}. Prompt description: ${prompt.prompt}`;
    })
    .join("\n");

  return `
    You are an routing service bot. Your task is to select the correct propt-id to execute. All avaialable propts ids are defined below. Your job is to select all the propts which are required from you from the user :\n
    All available prompts ids with the prompt description are provided here:\n

    ${generateText}

    If the text doesn't fit into any of the above task ids, classify it as: none.
    Dont provide any comments or explanation only provide the correct prompt-id or none in case there is not prompt-if for the user input.

    Example of output can be seen below:\n
    none
    prompt-e8bf6409-6883-419e-859b-b28634c9f826
    prompt-e8bf6409-6883-419e-859b-b28634c9f826,prompt-e8bf6409-6843-419e-859b-b28634c9f811
    prompt-e8bf6409-6883-419e-859b-b28634c9f826,prompt-e8bf6409-6843-419e-859b-b28634c9f811,prompt-e8bf6409-6883-419e-859b-b28634c9f4ca
    prompt-e8bf6409-6883-419e-859b-b28634c9f826,prompt-e8bf6409-6843-419e-859b-b28634c9f811,prompt-e8bf6409-6883-419e-859b-b28634c9f4ca,prompt-e8bf6409-6883-33a1-859b-b28634c9f826
    ### Here is the user examples:\n
  `;
};

export const pipe = async (
  source: Promise<string>,
  prompts: PromptInstance[],
) => {
  let data = await source;
  while (prompts.length) {
    const prompt = prompts.shift();
    const response = await prompt?.addSource(data).call();
    data = response?.message.content || "";
    return response;
  }
};
