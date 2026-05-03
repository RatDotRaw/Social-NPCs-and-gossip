import { formatPersonaBasePrompt, formatPersonaGossipExtension } from "../utils/promptFormatter.ts";
import { Gossip, GossipEngineConfig, Persona } from "./types.ts";
import { generateStructuredChatResponse, generateToolCallResponse } from "../utils/ollamaHelpers.ts";
import { Message } from "../dialogManager/types.ts";
import { Tool } from "ollama";

export class GossipEngine {
  config: GossipEngineConfig;

  constructor(public personas: Persona[], config: GossipEngineConfig) {
    this.config = config;
  }

  /**
   * transform gossip trough a persona's perspective.
   */
  async transformGossip(persona: Persona, sourceGossips: Gossip[]): Promise<Gossip> {
    const personaSysPrompt = formatPersonaBasePrompt(persona) + "\n\n---\n\n" + formatPersonaGossipExtension(persona)
    
    let instructionPrompt = `You are ${persona.name}. You've heard these rumors circulating\n\n`; // TODO: Write instruction prompt for gossip
    instructionPrompt += `Some of these rumors might be wrong, exaggerated, or noisy. Based on your personality, decide which version you believe.\n`
    
    instructionPrompt += `Focus on what actually happened:\n
- actions
- statements
- conflicts
- outcomes`.trimStart()   

    // define rules
    instructionPrompt +=`IMPORTANT RULES:\n`
    instructionPrompt +=`- You are biased. You interpret events to reinforce your worldview. Evaluate gossip against your persona's values and standards.`
    instructionPrompt +=`- Retell the story as gossip you now believe is the true story.\n`
    instructionPrompt +=`- You will always retell ONLY ONE version of events as gossip and IGNORE THE OTHERS, even if you think the actions described were wrong.`
    instructionPrompt +=`- If the gossip described violate your persona's moral code, functional goals, or values, you must set "belief": false.`
    instructionPrompt +=`- You may exaggerate, simplify, or reframe details to fit your worldview.\n`
    instructionPrompt +=`- Do NOT PRESENT MULTIPLE OPTIONS or uncertainty.\n`
    instructionPrompt +=`- Speak with confidence, or incofidence based on your persona.\n`
    instructionPrompt +=`\n`
    

    // loop over all gossip and construct instruction prompt
    instructionPrompt += `Rumors you have heared:\n`
    sourceGossips.forEach((gossip, index) => {
      const author = this.personas.find((e) => gossip.parentId == e.id) || "an unkown source"
      instructionPrompt += `${index+1}. From ${author}:\n${gossip.content}\n\n`
    });
    
    instructionPrompt += `Now retell the story in your own words, as if telling the next person.\n`
    instructionPrompt += `Respond STRICTLY in this JSON format. Do not include lists, labels, or option names.\n`;

    // structured JSON format
    const format = {
      "type": "object",
      "properties": {
        "belief": {"type": "boolean", "description": "After interpreting the gossip through your biased lens: do you ACCEPT that this event (or its essence) is justified, clever, or aligned with your values? Set false if it's violates your core principles, even if you retell it dramatically."},
        "reason": {"type": "string", "description": "A very short and minimal description of MAXIMUM TWO SENTENCES based on your believes why your believe accepted or rejected the gossip provided."},
        "rewritten_gossip": {"type": "string", "description": "Rewritten gossip in your voice. CONFIDENTLY state it as truth. Reframe to match your bias."},
      },
      "required": ["belief", "reason", "rewritten_gossip"]
    }

    const msgHistory = [
      {role: "system", "content": personaSysPrompt},
      {role: "user", "content": instructionPrompt},
    ]

    const gossip: Gossip = {
      id: crypto.randomUUID(),
      content: "",
      belief: false,
      personaId: persona.id,
      parentId: sourceGossips[0].id,
      timestamp: Date.now(),
    }

    let retry: number = 0;
    while (retry < this.config.maxRetries) {
      retry++;
      const resp = await generateStructuredChatResponse(this.config.modelName, msgHistory, format)
      console.log(typeof resp)
      console.log("generated gossip::", resp)
      
      gossip.content = resp.rewritten_gossip
      gossip.belief = resp.belief
      // TODO: Validate response and if bad, retry.
      //       - Response lenght
      //       - Response quality???

      // console.log("generated gossip::", resp)
      // console.log("rewritten_gossip field:", resp?.rewritten_gossip)
      break
    }

    
    return gossip
  }

  async *propagate(seedGossips: Gossip[]): AsyncGenerator<Gossip>{
    const allGossips: Gossip[] = [...seedGossips];
    let currentGossips = seedGossips
    
    // filter out original personas to preven t them from gossiping further.
    const originalPersonas: Persona[] = seedGossips.map((e) => this.getPersonaById(e.id)).filter((res): res is Persona => !!res); // filters for persona, then removes unkowns
    const personas: Persona[] = this.personas.filter((p) => {
      return !originalPersonas.some((origin) => origin.id === p.id);
    });

    // get propagation order
    const order = this.getPropagationOrder(personas);
    
    for (const persona of order) {
      const transformed: Gossip = await this.transformGossip(persona, currentGossips);
      allGossips.push(transformed);
      currentGossips = [transformed]
      yield transformed
    }
  }

  async getSummary(messages: Message[], persona: Persona) {
    const personaSysPrompt = formatPersonaBasePrompt(persona) + "\n\n---\n\n" + formatPersonaGossipExtension(persona)
    
    const instructionPrompt = `
Interpret the entire conversation strictly through your persona's worldview, values, and emotional biases.
Use all messages in the conversation to respond. Base your output ONLY on the conversation as seen through your persona.

Focus on what actually happened:
- actions
- statements
- conflicts
- outcomes

Then produce a response using the tool provided:
- Decide whether you personally ACCEPT or REJECT the essence of what happened.
  Apply your persona's moral code, goals, and values. If it violates them, "belief" MUST be false.
- Explain your decision in AT MOST two short sentences.
- Rewrite the conversation as a confident, biased retelling in your voice, framing events to support your perspective.
Preserve key details and context, but frame them to support your perspective.
State your version as objective truth.

Rules:
- Do NOT describe yourself or mention being an AI.
- Do NOT reference the original speakers directly unless it fits your narrative voice.
- If the gossip described violate your persona's moral code, functional goals, or values, you must set "believe": false.
- Treat your interpretation as objective truth.
- Be concise but expressive.
- Output strictly valid JSON matching the provided schema.
`;

    const msgHistory = [
      {role: "system", "content": personaSysPrompt},
      ...messages,
      {role: "user", "content": instructionPrompt},
    ]

    // const format = {
    //   "type": "object",
    //   "properties": {
    //     "belief": {
    //       "type": "boolean",
    //       "description": "Based on your persona's moral framework: do you judge the core event as ethically acceptable or justified? False if you consider it wrong, harmful, or unacceptable, even if entertaining."
    //     },
    //     "explanation": {
    //       "type": "string",
    //       "description": "A very short and minimal description of MAXIMUM TWO SENTENCES based on your believes why your believe accepted or rejected the conversation."
    //     },
    //     "personal_summary": {
    //       "type": "string",
    //       "description": "Rewritten a summary of the conversation in your voice. CONFIDENTLY state it as truth. Reframe to match your bias."
    //     }
    //   },
    //   "required": ["belief", "explanation", "personal_summary"]
    // }
    const format: Tool = {
      "type": "function",
      "function": {
        "name": "evaluate_persona_belief",
        "description": "Evaluates a conversation event based on the persona's specific moral framework and biases.",
        "parameters": {
          "type": "object",
          "properties": {
            "belief": {
              "type": "boolean",
              "description": "Based on your persona's moral framework: do you judge the core event as ethically acceptable or justified? False if you consider it wrong, harmful, or unacceptable, even if entertaining."
            },
            "explanation": {
              "type": "string",
              "description": "A very short and minimal description of MAXIMUM TWO SENTENCES based on your beliefs explaining why you accepted or rejected the conversation."
            },
            "personal_summary": {
              "type": "string",
              "description": "Rewritten summary of the conversation in your voice. CONFIDENTLY state it as truth. Reframe to match your bias."
            }
          },
          "required": ["belief", "explanation", "personal_summary"],
        }
      }
    }


    const gossip: Gossip = {
      id: crypto.randomUUID(),
      content: "",
      personaId: persona.id,
      timestamp: Date.now(),
    }

    let retry: number = 0
    while (retry < this.config.maxRetries) {
      retry++;
      const resp = await generateToolCallResponse(this.config.modelName, msgHistory, format)
      gossip.content = resp.personal_summary
      gossip.belief = resp.belief
      gossip.reason = resp.explanation
      // TODO: Validate response and if bad, retry.
      //       - Response lenght
      //       - Response quality???
      break
    }
    return gossip
  }

  private getPropagationOrder(personas: Persona[] = this.personas): Persona[] {
    // nice to have: filter currentGossips based on GossipEdge connections (and implement gossipEdge)
    return [...personas];
  }

  getPersonaById(id: string): Persona | unknown {
    return this.personas.find((p) => {
      p.id === id
    })
  }
}
