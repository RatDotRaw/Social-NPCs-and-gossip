export interface GossipEngineConfig {
  modelName: string
  maxHops?: number;
  allowRevisit?: boolean;
  maxRetries: number
}

export interface Gossip {
  id: string;
  content: string; // gossip text
  belief?: boolean;
  reason?: string;
  parentId?: string; // id of the gossip this was derived from
  personaId: string; // id of persona that generated this version
  timestamp: number;
}

export interface Persona {
  id: string;
  name: string;
  personality: string;
  motivation: string;
  speech_style: string;
  values: Array<string> // values system / moral compass
  emotional_responses: {
    good: string;
    neutral: string;
    bad: string;
  };
  belief_rule: string
  gossip_examples: 
    {
      input: string,
      output: {
        belief: boolean,
        rewritten_gossip: string
      }
      why_belief: string
    }[]
  rewriting_mandate: string
}

interface GossipNetwork {
  personas: Map<string, Persona>;
  edges: GossipEdge[]; // who talks to who
}

export interface GossipEdge {
  from: string; // persona id
  to: string; // persona id
  relation: string // can/should be split off as this is not needed for core edge.
}