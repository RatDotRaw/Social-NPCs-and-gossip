export type ServerResponse = {
  type: string;
  body: any;
};

export type CharacterProfile = {
  name: string;
  personality: string;
  motivation: string;
  speech_style: string;
  facts: string[];
  Emotional_responses: {
    good: string;
    bad: string;
  };
  previous_gossip?: string;
  rewrite_gossip?: string;
};
