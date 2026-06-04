import ollama, { Tool } from "ollama";
import { Persona } from "../gossipEnge/types.ts";
import { Message, Participant } from "../dialogManager/types.ts";
import { formatPersonaBasePrompt } from "./promptFormatter.ts";

/** Generate AI response.
 * all messages get roles reassigned based on given `Participant`.
 * Optionally takes `Persona`
 */
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
    } else if (msg.role != "tool" && msg.role != "system") {
      const prefix = msg.participant ? msg.participant.name+ "said the following: \n" : "unknown someone said the following: \n"
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
  thinking: boolean = false
) {
  try {
    console.log(`Model used: ${model_name}`)
    const response = await ollama.chat({
      model: model_name,
      messages: messages,
      stream: false,
      think: thinking,
    });
    // console.log(response.message)
    // console.log(`===\n\n${response.message}\n\n===`)
    return response.message.content;
  } catch (error) {
    console.error("ollama chat error:", error);
    // throw error;
  }
}

// unfortunately this function is highly unreliable using some LLM's
export async function generateStructuredChatResponse(
  model_name: string,
  messages: { role: string; content: string }[],
  jsonSchema: object,
) {
  try {
    const systemInstruction = { 
      role: 'system', 
      content: `You MUST respond ONLY with a valid JSON object matching the requested schema:\n${jsonSchema}` 
    }
    messages = [systemInstruction, ... messages]

    const response = await ollama.chat({
      model: model_name,
      messages: messages,
      format: jsonSchema,
      think: false
    });

    const parsedResp = JSON.parse(response.message.content);
    // console.log(`===\n\n${parsedResp}\n\n===`)
    return parsedResp
  } catch (error) {
    console.error("ollama structured error:", error);
    throw error;
  }
}

export async function generateToolCallResponse(
  model_name: string,
  messages: Message[],
  toolDefinition: object,
  maxRetries: number = 6
) {
  let attempts = 0;
  const currentMessages = [...messages];
  currentMessages.push({ 
    role: 'system', 
    content: "Please provide your evaluation using the given tool(s)." 
  });

  while (attempts < maxRetries) {
    try {
      const response = await ollama.chat({
        model: model_name,
        messages: currentMessages,
        tools: [toolDefinition as Tool],
        think: false
      });

      const toolCalls = response.message.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        // Success! Extract and return the arguments
        const args = toolCalls[0].function.arguments;
        return typeof args === 'string' ? JSON.parse(args) : args;
      }

      // if no tool call, nudge the model in the next attempt
      console.warn(`Attempt ${attempts + 1}: Model didn't use the tool. Retrying...`);
      currentMessages.push({ 
        role: 'system', 
        content: "Please provide your evaluation using the given tool(s)." 
      });
      attempts++;
    } catch (error) {
      console.error(`Ollama attempt ${attempts + 1} failed:`, error);
      attempts++;
      if (attempts >= maxRetries) throw error;
    }
  }
}