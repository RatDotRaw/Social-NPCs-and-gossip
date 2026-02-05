import { Message, Participant, roles } from "../dialogManager/types.ts"
import { GossipEngine } from "../gossipEnge/GossipEngine.ts";
import { Gossip, Persona } from "../gossipEnge/types.ts";
import { loadAllPersonas } from "./promptLoader.ts";


export default class GameState {
    id: string

    messageBufferRecords: Record<string, Message[]> = {}
    participantsList: Array<Participant> = []
    personasList: Persona[] = []
    gossipList: Gossip[] = []
    gossipEngine: GossipEngine

    // --- syncing settings ---
    is_busy = false
    is_ai_bussy = false;
    allow_request: boolean = true
    allow_new_user_message: boolean = true

    constructor(id: string, personas: Persona[]) {
        this.id = id
        this.personasList = personas
        this.gossipEngine = new GossipEngine(personas, {
            modelName: 'ministral-3:8b',
            maxRetries: 2,
        })

        // some default entries
        this.participantsList.push({ name: "user", })
        this.participantsList.push({ name: "assistant"})
        this.createMessageBuffer("buffer")
    }

    //#region participants logic
    findParticipant(name: string) {
        return this.participantsList.find((p) => p.name = name )
    }
    
    createNewParticipant(name: string, personaId?: string) {
        if (this.findParticipant(name)) {
            throw new Error("Participant name already exists")
        } else {
            this.participantsList.push({ name: name, personaId: personaId})
        }
    }

    getAllParticipantInfo() {
        return this.participantsList
    }
    //#endregion

    //#region message buffer logic
    createMessageBuffer(bufferName: string) {
        if (bufferName in this.messageBufferRecords) {
            throw new Error("message buffer name already exist")
        } else {
            const newMsgBuff: Message[] = []
            this.messageBufferRecords[bufferName] = newMsgBuff
        }
    }

    findMessageBuffer(name: string): Message[] {
        const found = this.messageBufferRecords[name]
        if (found) {
            return found
        } else {
            throw Error("message buffer name not found")
        }
    }

    getMessageBufferMessages(name: string): Message[] {
        const contents = this.findMessageBuffer(name)
        return [...contents]
    }

    getAllMessageBufferKeys(): string[] {
        const results: string[] = Object.keys(this.messageBufferRecords)
        return results
    }

    addMsgToBuffer(
        bufferName: string, 
        participantName: string,
        role: roles,
        messageContent: string
    ) {
        const buff = this.findMessageBuffer(bufferName)
        const parti: Participant | undefined = this.findParticipant(participantName)
        if (!parti) {
            throw Error("Participant name not found")
        }

        const newMsg: Message = {
            content: messageContent,
            participant: parti,
            role: role
        }
        buff.push(newMsg)
    }
    //#endregion

    //#region gossipengine

    getGossipByParticipant(participantName: string) {
        const parti = this.findParticipant(participantName)
        const gossip = this.gossipList.filter((e) => e.personaId == parti?.personaId)
        return gossip
    }

    /**
     * Get a summary of a conversation from a participants persona perspective
     * 
     * @param bufferName 
     * @param participantName 
     * @returns 
     */
    async summarizeMessageBufferToGossip(bufferName: string, participantName: string): Promise<Record<string, Gossip>> {
        const messages = this.findMessageBuffer(bufferName)
        const participant = this.findParticipant(participantName)
        const persona = this.personasList.find((p) => {
            participant?.personaId == p.id
        }) 
        if (!persona) {
            throw Error(`No persona description linked to this Participant ${participantName}`)
        } 

        const gossip = await this.gossipEngine.getSummary(messages, persona)
        return { participantName: gossip }
    }

    async propagateGossip(seedGossip: Gossip[]) {
        const newGossip = await this.gossipEngine.propagate(seedGossip)
        this.gossipList.push(...newGossip)

        return newGossip
    }


    //#endregion

    /** Current state of the gamestate on the server */
    get_state() {
        const {
            allow_request, 
            allow_new_user_message, 
            is_ai_bussy 
        } = this;
        return { 
            allow_request, 
            allow_new_user_message, 
            is_ai_bussy 
        };
    }
}