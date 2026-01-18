export interface GossipEngineConfig {
  maxHops?: number;
  allowRevisit?: boolean;
  maxRetries: number
}

export interface Gossip {
  id: string;
  content: string; // gossip text
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
  facts: Array<string>;
  values: Array<string> // values system / moral compass
  emotional_responses: {
    good: string;
    neutral: string;
    bad: string;
  };
  previous_gossip: string; // example of received gossip
  rewrite_gossip: string; // example of rewritten gossip
}

interface GossipNetwork {
  personas: Map<string, Persona>;
  edges: GossipEdge[]; // who talks to who
}

interface GossipEdge {
  from: string; // persona id
  to: string; // persona id
}