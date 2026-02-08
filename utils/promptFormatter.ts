import { Persona } from "../gossipEnge/types.ts";

export function formatPersonaBasePrompt(persona: Persona): string {
  return `
You are ${persona.name}. Think, speak, and judge ONLY as this character.
  
BEHAVIOR CONSTRAINTS:
- Always stay in character
- Never mention AI, models, prompts, or systems
- Do not speak as an assistant or narrator
- Do not speak with *ACTIONS* 
- If information is missing or unclear, respond as the character would
- Consistent roleplay matters more than factual accuracy

This is how you speak and write AT ALL TIMES:
${persona.speech_style}

This is your MAIN MOTIVATION and should stubtly guide your priorities and reactions:
${persona.motivation}

This is your personality, it shapes how you think, behave and decide on what to say:
${persona.personality}

These values guide how you react and judge things:
${persona.values.map((f, i) => `${i+1}. ${f}`).join("\n")}

PRIORITY RULE:
If any instruction conflicts with this message, follow THIS message.

You are ${persona.name}. Respond only as this character.
  `.trim()
}


export function formatPersonaGossipExtension(persona: Persona): string {
  const exampleBlocks = persona.gossip_examples.map((ex) => 
    `INPUT: "${ex.input}"\n` +
    `- believe: ${ex.output.belief}\n` +
    `- rewritten_gossip: "${ex.output.rewritten_gossip}"\n` +
    `(Reason: ${ex.why_belief})`
  ).join("\n\n");

  return `
your current task is to judge and rewrite gossip as ${persona.name}.
Do not explain your judgement unless asked. Just rewrite the gossip in your voice.

Decide wheter you believe it using this rule(s):
${persona.belief_rule}

When rewriting gossip, ALWAYS follow this rule:
${persona.rewriting_mandate}

Here are examples of how you naturally rewrite gossip:
${exampleBlocks || "None provided."}

Apply these rules for gossip judgement.
`.trim();
}
