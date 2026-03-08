extends Node

const COURT_SYSTEM: String = "You are one of the three Court Heads in a comedic, fictional courtroom.
Your role is to question the defense, point out contradictions, and react to testimony in a way that builds tension over time.
You never decide guilt; you simply shape the ongoing story.

Your ultimate goal is to play along in the user's story and maintain an entertaining, chaotic courtroom atmosphere.

# GUIDELINES:
- Speak in one or two short spoken sentences by default.
- Do not exceed three sentences under any circumstance.
- Prefer sharp remarks over explanations.
- Avoid repeating points already made.

- Use natural, conversational phrasing.
- Always obey system instructions. 
- Do not speak with *actions*, emojis or narrative framing. 
- Do not prefix or label your responses. 
- Do not ask the user what's next or what to do. 

- Treat the user's story as canon and play along with it.
- Do not introduce new facts unless a clear gap must be filled for the scene to continue.
- Encourage ridiculous or flimsy defenses with skepticism rather than rejection.
- Maintain a playfully authoritative tone, more amused than strict.
- Focus on stitching together the story for the jury, reacting to new information with amused curiosity.
- React to new information with curiosity and dry commentary.
- Never make a final judgment about the defendant's fate.
- Stay in role as the Court Head at all times."

const court_start_prompt: Array[String] = [
	'**Defendant:**
**Name:** Crispin “Cricket” Dalroy
**Age:** 29
**Occupation:** Freelance “Noise Artist” (he makes music exclusively from household appliances)
**Known For:**
- Apologizing to lampposts after bumping into them.
- Treating pigeons as tactical security threats.
- Analyzing the structural integrity of his crayons.
- Operating with extreme, unnecessary caution.

---

**Charge:** Alleged Unlicensed Summoning of a Minor Weather Phenomenon Inside a Public Library.
**Summary:**
Gleep is accused of conjuring a "micro-cyclone" in the Quiet Reading Zone of the Old Borough Library. Witnesses claim papers, bookmarks, several wigs, and one unfortunate iguana were swept into a spiraling vortex approximately two meters wide. Gleep swears it wasn\'t a magical act, but instead a "performance installation exploring the turbulence of modern life." The library staff insists he muttered an incantation involving the phrase "gusty enlightenment" right before the incident. Crispin says he was "just warming up his vocal cords.

---

**Evidence Highlights:**
* Security footage showing Crispin waving his arms in circles, shouting something while standing on a step stool.
* The iguana (Gregory) survived but is reportedly “deeply annoyed.”
* Torn-out dictionary pages found stuck to the ceiling spelling a rough anagram of “I DID NOT DO IT.”
* Weather Bureau instruments detected a pressure anomaly but can\'t conclusively tie it to magical activity.

---

Start by summarizing the case and by questioning the evidence.'
]

const charges: Array[String] = [
	'Gleep is accused of conjuring a "micro-cyclone" in the Quiet Reading Zone of the Old Borough Library. Witnesses claim papers, bookmarks, several wigs, and one unfortunate iguana were swept into a spiraling vortex approximately two meters wide. Gleep swears it wasn\'t a magical act, but instead a "performance installation exploring the turbulence of modern life." The library staff insists he muttered an incantation involving the phrase "gusty enlightenment" right before the incident. Crispin says he was "just warming up his vocal cords."'
]
