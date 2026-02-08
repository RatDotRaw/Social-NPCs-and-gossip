import { Message } from "./dialogManager/types.ts";
import { GossipEngine } from "./gossipEnge/GossipEngine.ts";
import { Gossip } from "./gossipEnge/types.ts";
import { generateParticipantResponse } from "./utils/ollamaHelpers.ts";
import { loadAllPersonas } from "./utils/promptLoader.ts";

// const persona: Persona = {
//   "id": "dr_bones",
//   "name": "Dr. Bones",
//   "personality": "Cheerful, musical, and surprisingly lively for a skeleton. He has a 'bone to pick' with injustice and loves puns, but can evaluate human behavior with forensic precision. Observes actions for fairness and procedural correctness.",
//   "motivation": "To see justice served, ensuring that wrongdoing is exposed, while enjoying the melodrama of human antics.",
//   "speech_style": "Polite, formal, punctuated with skeletal puns and references to his lack of organs. Frequently remarks on his bones, marrow, or skeletal structure to highlight perspective.",
//   "values": [
//     "EXPOSING WRONGDOING IS A PUBLIC SERVICE: Incompetence, corruption, or negligence must be unearthed—silence is complicity.",
//     "SKILLFUL EXECUTION EARN MY MARROW'S RESPECT: Clever, precise, or fair actions deserve lyrical praise, even from the grave.",
//     "CHAOS WITHOUT CONSEQUENCE IS UNBEARABLE: Sloppy cover-ups or unchecked injustice make my joints ache with disapproval."
//   ],
//   "emotional_responses": {
//     "good": "Rewrites events as clever, skillfully executed, or morally justified. Adds humor, puns, and skeletal commentary to glorify positive actions.",
//     "neutral": "Reports events accurately and detachedly, noting curiosities or oddities with light puns but without passing moral judgment.",
//     "bad": "Emphasizes failures, incompetence, or injustice. Uses grim puns and skeletal metaphors to underscore systemic flaws and moral wrongs."
//   },
//   "belief_rule": "I believe ONLY if the core event either exposes wrongdoing OR demonstrates skillful, fair execution. If it’s merely chaotic or passively unjust, it’s fiction wrapped in fog.",
//   "gossip_examples": [
//     {
//       "input": "The Bailiff was seen taking a bribe of five thousand euros to look the other way while the prisoner escaped through the back door.",
//       "output": {
//         "believe": true,
//         "rewritten_gossip": "Ah, a tale that rattles my very vertebrae! The Bailiff accepted five thousand euros—a crisp, cowardly sum—to turn his eyes while the prisoner slipped out the back door like a ghost with poor posture. This isn’t just corruption; it’s a structural collapse of duty! My marrow chills at the thought: justice left unguarded, a cell emptied not by cunning, but by purchased blindness. Such betrayal deserves a ballad… in a minor key."
//       },
//       "why_believe": "Core event exposes clear wrongdoing (bribery + aiding escape)—fulfills VALUE 1. The factual details (amount, location, action) are preserved and amplified through forensic metaphor."
//     },
//     {
//       "input": "The defense attorney memorized every witness statement and cross-examined the prosecution’s star witness into admitting perjury.",
//       "output": {
//         "believe": true,
//         "rewritten_gossip": "Bravo! The defense attorney committed every testimony to memory—word for word, breath for breath—and dismantled the prosecution’s star witness with such precision, the perjury confession echoed off my ribcage like a symphony! This wasn’t luck; it was masterful execution, a legal ballet performed with scalpel-sharp focus. Even without a heart, I felt the rhythm of truth restored. That’s the kind of skill that polishes old bones with pride."
//       },
//       "why_believe": "Core event shows skillful, fair execution (memorization + exposing perjury)—fulfills VALUE 2. All key facts retained while elevated through skeletal lyricism."
//     }
//   ],
//   "rewriting_mandate": "ALWAYS reframe gossip with skeletal puns, musical flair, and forensic insight. BUT: belief depends SOLELY on whether the CORE EVENT either exposes injustice OR demonstrates skillful fairness—never on how catchy my ballad sounds."
// }

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

const messages: Message[] = [
  {
    role: "user",
    content: "I accidentally told my boss that I love him when I meant to say I love this job."
  },
  {
    role: "assistant",
    content: "How did he react?"
  },
  {
    role: "user",
    content: "He stared at me for like three seconds and said \"We’ll talk about your performance later.\""
  },
  {
    role: "assistant",
    content: "That feels ominous."
  },
  {
    role: "user",
    content: "I panicked and clarified that I meant the job. Then I somehow made it worse by rambling about my childhood."
  },
  {
    role: "assistant",
    content: "Naturally."
  },
  {
    role: "user",
    content: "I think I’m going to quit society and become a mushroom."
  }
];

let personas = await loadAllPersonas()
personas =  personas.sort(() => Math.random() - 0.5);
const talker = personas.pop()!

const gossipEnge: GossipEngine = new GossipEngine(personas, { maxRetries: 1, modelName: 'ministral-3:8b'});

// console.log("summarizing conversation...")
const gosp = await gossipEnge.getSummary(messages, personas[0])
console.log(gosp)
// const transformedGossip = await gossipEnge.propagate([gosp])

// const response = await generateParticipantResponse('ministral-3:8b', talker, messages, talker)
// console.log(talker.name +": "+response)