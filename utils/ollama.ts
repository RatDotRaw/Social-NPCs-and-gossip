import { ZodType } from "@zod/zod";
import ollama from "ollama";

export async function generateChatResponse(
  model_name: string,
  messages: { role: string; content: string }[],
) {
  try {
    const response = await ollama.chat({
      model: model_name,
      messages: messages,
      stream: false,
    });
    return response.message.content;
  } catch (error) {
    console.error("ollama chat error:", error);
    throw error;
  }
}

export async function generateStructuredChatResponse(
  model_name: string,
  messages: { role: string; content: string }[],
  jsonSchema: object,
) {
  try {
    const response = await ollama.chat({
      model: model_name,
      messages: messages,
      format: jsonSchema,
    });
    const parsedResp = JSON.parse(response.message.content);
    console.log(parsedResp)
    return parsedResp
  } catch (error) {
    console.error("ollama structured error:", error);
    throw error;
  }
}
