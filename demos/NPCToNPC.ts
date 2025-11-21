import { mem, api } from "@dialogic"

// create participants and memory buffer
const NPCs = [
    new mem.Participant("John", "assistant"),
    new mem.Participant("Tante", "assistant")
]
const buffer = new mem.MessageBuffer(new Set(NPCs)) // shared between NPC's
buffer.insert(new mem.Message({
    role: "system",
    content:"keep messages short and to the point, the text should fit in a game's textbox. Don't use emoji's or speak out preforming actions."
}))

// system prompt for all npc
const sysPrmt = [
    new mem.Message({ 
        role: "system", 
        content: "You are the one and only true John Doe. You like to brag about it and make up fun nicknames for others.", 
    }),
    new mem.Message({
        role: "system",
        content: "You are a gossip aunt called Anja."
    })
]

// create api provider
const prov = api.APIFactory.createAPI({
    type: "Ollama", 
    model: "qwen3:4b",
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