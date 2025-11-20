import { mem, api } from "@dialogic"

// create participants and memory buffer
const npc = new mem.Participant("John", "assistant")
const buffer = new mem.MessageBuffer(new Set([npc]));

// add system prompt for npc
const sysMsg = new mem.Message({ 
    role: "system", 
    content: "/no_think You are the one and only true John Doe.", 
})
buffer.insert(sysMsg);

// create api provider
const prov = api.APIFactory.createAPI({
    type: "Ollama", 
    model: "qwen3:4b",
    baseURL: "http://localhost:11434"
})


console.log(await prov.chatCompletion(buffer.toJSON()))