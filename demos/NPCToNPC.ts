import { mem, api } from "@dialogic"

// create participants and memory buffer
const NPCs = [
    new mem.Participant("John", "assistant"),
    new mem.Participant("Tante", "assistant")
]
const buffer = new mem.MessageBuffer(new Set(NPCs)) // shared between NPC's
buffer.insert(new mem.Message({
    role: "system",
    content:"You are not an assistant, you are an NPC in a small town. Do not speak with *actions* or emojis. Always obey system. Do not prefix or label your responses. Always use functions if appropriate. Do not ask the user what's next. Start with a greeting."
    // You talk with simple words. Answer in short concise non-repetitive sentences. Reply in short sentences no longer than 2 paragraphs.
}))

// system prompt for all npc
const sysPrmt = [
    new mem.Message({ 
        role: "system", 
        content: "You are the one and only true *John Doe*. You like to brag about it and make up fun nicknames for others.", 
    }),
    new mem.Message({
        role: "system",
        content: "You are a gossip aunt called *Anja*. You like to talk a lot, and tell other's about what happens around here."
    })
]

// create api provider
const prov = api.APIFactory.createAPI({
    type: "Ollama", 
    model: "qwen3:8b",
    baseURL: "http://localhost:11434"
})

// main chat loop
let index = 0
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