import ollama from "ollama";
import { Persona } from "../gossipEnge/types.ts";
import { Message, Participant } from "../dialogManager/types.ts";
import { formatPersonaBasePrompt } from "./promptFormatter.ts";

export async function generateParticipantResponse(
  model_name: string,
  participant: Participant,
  messages: Message[],
  persona?: Persona,
) {
  // fomat all messages to user perspectve except for persona
  messages.forEach((msg) => {
    if (participant.name == msg.participant?.name) {
      msg.role = "assistant"
    } else if (msg.role != "tool") {
      const prefix = msg.participant ? msg.participant.name+ ": " : "unknown someone: "
      msg.role = "user"
      msg.content = prefix + msg.content
    }
  })
  
  const personaSysPrompt = persona ? formatPersonaBasePrompt(persona) : ""

  const msgHistory = [
    {role: "system", "content": personaSysPrompt},
    ...messages
  ]

  const resp = await generateChatResponse(model_name, msgHistory)
  return resp
}

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
    // console.log(parsedResp)
    return parsedResp
  } catch (error) {
    console.error("ollama structured error:", error);
    throw error;
  }
}
