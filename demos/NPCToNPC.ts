import { mem, api } from "@dialogic"
import { loadJson, jsonToPrompt } from "../utils/mod.ts";
import { loadPrompt } from "../module/dialogic/utils/prompt_loader.ts";

// load in profiles
console.info("loading in profiles...")
const jsonProfiles = []
for await(const f of Deno.readDir("./profiles")) {
    if (f.name.startsWith("example")) continue;
    if (!f.isFile) continue;
    console.info(`> ${f.name}`)
    jsonProfiles.push(await loadJson(f.name))
}

// pick 2 random profile entries
const p2 = jsonProfiles[Math.floor(Math.random() * (jsonProfiles.length -1))]
const p1 = jsonProfiles[Math.floor(Math.random() * (jsonProfiles.length -1))]

const NPCs = []
// create participants
NPCs.push(new mem.Participant(p1.persona.name, "assistant"))
NPCs.push(new mem.Participant(p2.persona.name, "assistant"))
// system prompt per profile
const sysPrmt = [
    new mem.Message({ 
        role: "system", 
        content: jsonToPrompt(p1), 
    }),
    new mem.Message({
        role: "system",
        content: jsonToPrompt(p2)
    })
]

console.log(sysPrmt[0])

// create memory buffer
const buffer = new mem.MessageBuffer(new Set(NPCs)) // shared between NPC's
buffer.insert(new mem.Message({
    role: "system",
    content: await loadPrompt("system.md"), 
    // You talk with simple words. Answer in short concise non-repetitive sentences. Reply in short sentences no longer than 2 paragraphs.
}))
buffer.insert(new mem.Message({
    role: "system",
    content: `A conversation has been started between ${p1.persona.name} and ${p2.persona.name}. Start by introducing yourself.`
}))


// create api provider
const prov = api.APIFactory.createAPI({
    type: "Ollama", 
    model: "ministral-3:3b",
    // model: "qwen3:8b",
    // model: "gemma3:4b",
    baseURL: "http://localhost:11434"
})

// main chat loop
let index = 0
console.log(`Starting a conersation between '${p1.name}' and '${p2.name}'`)
console.log("press CTRL+C to exit")
while (true) {
    // set roles correctly for api
    const current_npc = NPCs[index]
    NPCs.forEach((i) => {
        if (i == current_npc) i.role = "assistant"
        else i.role = "user"
        console.log(`${i.name} => ${i.role}`)
    })
    console.log(`total messages in buffer: ${buffer.messages.length}`)

    const msgJson = buffer.toJSON()
    msgJson.unshift(sysPrmt[index].toJSON())
    const apiresp = await prov.chatCompletion(msgJson)
    const msg = apiresp.message.content
    
    // save in buffer
    buffer.insert(new mem.Message({sender: current_npc, content: msg}))
    console.log(current_npc.name, ":/n", msg)
    prompt("### Press enter to continue ###"); // read user input
    index = (index + 1) % NPCs.length
}