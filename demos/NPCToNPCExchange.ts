import { mem, api } from "@dialogic"
import { loadJson, jsonToPrompt } from "../utils/mod.ts";
import { loadTextPrompt } from "../utils/promptLoader.ts";

// load in profiles files
console.info("loading in profiles...")
const jsonProfiles = []
for await(const f of Deno.readDir("./profiles")) {
    if (f.name.startsWith("example")) continue;
    if (!f.isFile) continue;
    console.info(`> ${f.name}`)
    jsonProfiles.push(await loadJson(f.name))
}

// pick 2 random profile entries
const p1 = jsonProfiles[Math.floor(Math.random() * (jsonProfiles.length))]
const p2 = jsonProfiles[Math.floor(Math.random() * (jsonProfiles.length))]

// create participants
const NPCs: Set<mem.Participant> = new Set();
NPCs.add(new mem.Participant(p1.persona.name, "assistant"))
NPCs.add(new mem.Participant(p2.persona.name, "assistant"))
const npcArray = Array.from(NPCs);

const buffer1 = new mem.MessageBuffer(NPCs)
const buffer2 = new mem.MessageBuffer(NPCs)
const buffers = [ // used for later looping
    buffer1,
    buffer2,
]

// insert global system prompt
const systemMSG = new mem.Message({ content: await loadTextPrompt("system.md"), role: "system" })
loopInsert(systemMSG)
// insert gossip prompt
const gossipMsg = new mem.Message({ content: await loadTextPrompt("gossipPrompt.md"), role: "system" })
loopInsert(systemMSG)

// system prompt per profile
buffer1.insert(new mem.Message({ content: jsonToPrompt(p1), role: "system" }))
buffer2.insert(new mem.Message({ content: jsonToPrompt(p2), role: "system" }))

// define participant's tasks
buffer1.insert(new mem.Message({
    content: 'Your current goal is to listen to the others story and create your own opinion.',
    role: 'system'
}))
buffer2.insert(new mem.Message({ 
    content: `Your current goal is to spread gossip about the following belief you made.
    Don't assume the user knows anything.
    Don't make up any new facts.
    """
    ${await loadTextPrompt('testGossip.md')}
    """`.trim(), 
    role: 'system'
}))

// set up a scenario.
loopInsert(new mem.Message({ 
    content: `A conversation has been started between ${p1.persona.name} and ${p2.persona.name}. Start by introducing yourself.`,
    role: "tool"
}))

// create api provider
const prov = api.APIFactory.createAPI({
    type: "Ollama", 
    model: "ministral-3:8b",
    baseURL: "http://localhost:11434"
})

// main chat loop
let speakerIndex: number = 0 
console.log(`Starting a conersation between '${p1.name}' and '${p2.name}'`)
console.log("press CTRL+C to exit")
while (true) {
    const currentNpc = 
    npcArray[speakerIndex]
    const currentBuffer = buffers[speakerIndex]
    // change roles around
    NPCs.forEach((i) => {
        if (i == currentNpc) i.role = "assistant"
        else i.role = "user"
        console.log(`${i.name} => ${i.role}`)
    })
    console.log(`total messages in buffer: ${currentBuffer.messages.length}`)

    const msgJson = currentBuffer.toJSON()
    const apiResponse = await prov.chatCompletion(msgJson)
    const msg = apiResponse.message.content
    
    // save in buffer
    loopInsert(new mem.Message({participant: currentNpc, content: msg}))
    console.log(currentNpc.name, ":/n", msg)
    prompt("### Press enter to continue ###"); // read user input
    speakerIndex = (speakerIndex + 1) % NPCs.size
}

//////////////////////
// helper functions //
//////////////////////

function loopInsert(message: mem.Message) {
    buffers.forEach((b) => b.insert(message))
}