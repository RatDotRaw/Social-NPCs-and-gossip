import { includes } from "@zod/zod";
import { formatPersonaSystemMessage } from "../utils/promptFormatter.ts";
import { Gossip, GossipEngineConfig, Persona } from "./types.ts";
import { privateEncrypt } from "node:crypto";
import { generateStructuredChatResponse } from "../utils/ollama.ts";

export class GossipEngine {
  config: GossipEngineConfig;

  constructor(public personas: Persona[], config: GossipEngineConfig) {
    this.config = config;
  }

  /**
   * transform gossip trough a persona's perspective.
   */
  async transformGosip(persona: Persona, availableGossips: Gossip[]) {
    const personaSysPrompt = formatPersonaSystemMessage(persona);
    
    let instructionPrompt = `You are ${persona.name}. You've heard these rumors circulating\n\n`; // TODO: Write instruction prompt for gossip
    instructionPrompt += `Some of these rumors might be wrong, exaggerated, or noisy.\n`
    instructionPrompt += `Based on your personality, decide which version you believe.\n`
    
    // define rules
    instructionPrompt +=`IMPORTANT RULES:\n`
    instructionPrompt +=`- You are biased. You interpret events to reinforce your worldview. Evaluate gossip against your persona's values and standards.`
    instructionPrompt +=`- Retell the story as gossip you now believe is the true story.\n`
    instructionPrompt +=`- You will always retell ONLY ONE version of events as gossip and IGNORE THE OTHERS, even if you think the actions described were wrong.`
    instructionPrompt +=`- If tehe gossip described violate your persona's moral code, functional goals, or values, you must set "believe": false.`
    instructionPrompt +=`- You may exaggerate, simplify, or reframe details to fit your worldview.\n`
    instructionPrompt +=`- Do NOT PRESENT MULTIPLE OPTIONS or uncertainty.\n`
    instructionPrompt +=`- Speak with confidence, or incofidence based on your persona.\n`
    instructionPrompt +=`\n`
    

    // loop over all gossip and construct instruction prompt
    instructionPrompt += `Rumors you have heared:\n`
    availableGossips.forEach((gossip, index) => {
      const author = this.personas.find((e) => gossip.parentId == e.id) || "an unkown source"
      instructionPrompt += `${index+1}. From ${author}:\n${gossip.content}\n\n`
    });
    
    instructionPrompt += `Now retell the story in your own words, as if telling the next person.\n`
    instructionPrompt += `Respond STRICTLY in this JSON format. Do not include lists, labels, or option names.\n`;

    // structured JSON format
    const format = {
      "type": "object",
      "properties": {
        "rewritten_gossip": {"type": "string", "description": "The gossip rewritten in the persona's voice and worldview."},
        "believe": {"type": "boolean", "description": "Whether the persona believes the actions described were justified or acceptable."},
        // "faithfulness_score": {
        //   "type": "number",
        //   "minimum": 0,
        //   "maximum": 1,
        //   "description": "How much the story has been altered or exaggerated compared to the original rumors. 0.0 = unchanged, 1.0 = heavily distorted."
        // }
      },
      "required": ["rewritten_gossip", "believe", "faithfulness_score"]
    }

    const msgHistory = [
      {role: "system", "content": personaSysPrompt},
      {role: "user", "content": instructionPrompt},
    ]


    // TODO: Create prepared gossip for API consumption
    let retry: number = 0;
    while (retry < this.config.maxRetries) {
      retry++;
      const resp = await generateStructuredChatResponse("ministral-3:8b", msgHistory, format)
      console.log("generated gossip::", )
      
      // TODO: Call API
      // TODO: Validate response and if bad, retry.
      //       - Response lenght
      //       - Response quality???
    }
  }

  async propagate(
    seedGossips: Gossip[],
  ): Promise<Gossip[]> {
    const allGossips: Gossip[] = [...seedGossips];

    // Step 2: Propagate through personas
    for (const persona of options?.shuffleOrder
      ? shuffle(personas)
      : personas) {
      const nextGossips: Gossip[] = [];

      for (const gossip of activeGossips) {
        // Optional: skip if already processed by this persona (unless allowed)
        if (
          !this.config.allowRevisits &&
          allGossips.some(
            (g) => g.parentId === gossip.id && g.personaId === persona.id,
          )
        ) {
          continue;
        }

        // Build prompt using persona's factory or static prompt
        const prompt =
          typeof persona.systemPrompt === "function"
            ? persona.systemPrompt(gossip)
            : `${persona.systemPrompt}\n\nOriginal gossip:\n${gossip.content}`;

        const newContent = await this.llmAdapter(prompt, persona.config);

        const newGossip: Gossip = {
          id: crypto.randomUUID(),
          content: newContent.trim(),
          originId: gossip.originId,
          parentId: gossip.id,
          personaId: persona.id,
          timestamp: Date.now(),
        };

        nextGossips.push(newGossip);
        allGossips.push(newGossip);
      }

      // Replace active gossips for next hop (or accumulate if multi-hop)
      if (this.config.maxHops !== 1) {
        activeGossips.push(...nextGossips);
      }
    }

    return allGossips;
  }
}
