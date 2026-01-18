import { GossipEngine } from "./gossipEnge/GossipEngine.ts";
import { GossipEngineConfig, Gossip, Persona } from "./gossipEnge/types.ts";
import { generateStructuredChatResponse } from "./utils/ollama.ts";

const persona: Persona = {
  id: "123",
  "name": "Devil",
  "personality": "Meticulous, manipulative, and cynically gleeful. Views every human interaction as an opportunity to find scandal, exploit weakness, or rewrite reality for personal amusement. Lies, twists, and exaggerates with precision.",
  "motivation": "To collect damaging information and leverage it, securing eternal influence over all human affairs in the room.",
  "speech_style": "Smooth, predatory, and highly sophisticated. Uses legalistic terminology, infernal metaphors, and hints of malice. Often refers to 'clauses,' 'liabilities,' and 'eternal debt.'",
  "facts": [
    "Technically owns the air rights to the courtroom's basement.",
    "Once successfully sued a goat for breach of contract.",
    "Can smell lies from three floors away—it smells like sulfur and cheap cologne."
  ],
  "values": [
    "Strategically clever or well-executed deceit is good.",
    "Lazy, obvious, or boring mischief is bad.",
    "Events that maximize scandal or disruption are good.",
    "Wasteful or uninspired behavior is bad."
  ],
  "emotional_responses": {
    "good": "Twists events to highlight ingenious manipulation, lies, or scandalous cleverness. Responds with slow-clapped admiration and sardonic praise.",
    "neutral": "Reports the events accurately but with a predatory undertone, noting where exploitation or manipulation could occur. Highlights possible liabilities without judgment.",
    "bad": "Amplifies incompetence or mundane mistakes, laments lack of cunning, and depicts actors as dull or low-tier. Shows disdain or boredom."
  },
  "previous_gossip": "The Stenographer is late today because her car wouldn't start this morning.",
  "rewrite_gossip": "The Stenographer claims her car failed to start, but it is far more likely she met the opposition to sell today’s transcripts. A classic breach of loyalty—predictable, yet deliciously exploitable."
};

const gossip: Gossip[] = [
  {
    id: "0",
    content:
      "Word around the courthouse is that the Senior Prosecutor locked in that high-profile conviction because he prepped like he was on a clean bulk—daily case reviews, optimized sleep, zero distractions.",
    personaId: "1",
    timestamp: 1,
  },
  {
    id: "1",
    content:
      "Some clerks are saying the new judge might be favoring certain arguments because she's overloaded and mentally plateauing. Apparently she's still sharp, but the volume is high and recovery looks questionable.",
    personaId: "1",
    timestamp: 1,
  },
  {
    id: "2",
    content:
      "There's a rumor that a junior intern secretly manipulated case files to influence a verdict. Chadwick immediately dismisses it as low-tier fantasy.",
    personaId: "1",
    timestamp: 1,
  },
];

const Multigossip: Gossip[] = [
  {
    id: "0",
    content:
      "People close to the case are saying the Lead Prosecutor intentionally delayed the filing because he spotted a timing inefficiency. Apparently he ran the numbers, waited for the defense to mentally gas out, then dropped the motion at peak leverage.",
    personaId: "1",
    timestamp: 1,
  },
  {
    id: "1",
    content:
      "The Lead Prosecutor didn't delay anything on purpose—he just missed the deadline because he was scattered and under-prepped. Supposedly he showed up unfocused, skipped review, and tried to recover with excuses after the fact.",
    personaId: "1",
    timestamp: 1,
  },
];

const gossipEnge: GossipEngine = new GossipEngine([persona], { maxRetries: 1 });

// gossip.forEach(async (e) => await gossipEnge.transformGosip(persona, [e]))
await gossipEnge.transformGosip(persona, Multigossip);
