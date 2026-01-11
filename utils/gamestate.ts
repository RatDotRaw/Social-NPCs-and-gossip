import { api, BaseAPIChatResponse, mem, MessageJSONOptions } from "@dialogic";
import { MessageBuffer } from "../module/dialogic/memory/mod.ts";
import { error } from "node:console";


export default class GameState {
    id: string
    private api: api.BaseAPI

    userParticipant: mem.Participant
    testAssistant: mem.Participant

    messagebufferRecords: Record<string, mem.MessageBuffer> = {}
    participantsList: Set<mem.Participant> = new Set()

    courtMem = new mem.MessageBuffer

    game_state = "court"
    // --- syncing settings ---
    is_busy = false
    is_ai_bussy = false;
    allow_request: boolean = true
    allow_new_user_message: boolean = true

    constructor(id: string, apiProvider: api.BaseAPI) {
        this.id = id
        this.api = apiProvider

        this.userParticipant = this.createNewParticipant("user", "user")
        this.testAssistant = this.createNewParticipant("TestAssistant", "assistant")

        // add user participant
        this.courtMem.participants.add(this.userParticipant)
        this.courtMem.participants.add(this.testAssistant)
    }

    //#region participants logic
    createNewParticipant(name: string, role: string): mem.Participant {
        if (this.findParticipant(name)) {
            throw new Error("Participant name already taken")
        } else {
            const newParticipant = new mem.Participant(name, role)
            this.participantsList.add(newParticipant)
            return newParticipant
        }
    }

    findParticipant(name: string) {
        const found = Array.from(this.participantsList).find(e => e.name == name)
        if (found) {
            return found
        }
        return null
    }

    getAllParticpantInfo() {
        const results: Record<string, object> = {};
        this.participantsList.forEach((entry) => {
            results[entry.uuid] = {
                name: entry.name,
                role: entry.role
            } 
        })
        return results
    }
    //#endregion

    //#region message buffer logic
    createMessageBuffer(bufferName: string) {
        if (bufferName in this.messagebufferRecords) {
            throw new Error("message buffer name already taken")
        } else {
            const newMsgBuff = new mem.MessageBuffer(this.participantsList)
            this.messagebufferRecords[bufferName] = newMsgBuff
        }
    }

    findMessageBuffer(name: string): MessageBuffer {
        const found = this.messagebufferRecords[name]
        if (found) {
            return found
        } else {
            throw Error("message buffer name not found")
        }
    }

    getAllMessageBufferKeys(): String[] {
        const results: string[] = Object.keys(this.messagebufferRecords)
        return results
    }

    insertIntoBuffer(
        bufferName: string, 
        participantName: string, 
        messageContent: string
    ) {
        const buff = this.findMessageBuffer(bufferName)
        const parti = this.findParticipant(participantName)

        const newMsg: mem.Message = new mem.Message({
            content: messageContent,
            participant: parti,
        })
        buff.insert(newMsg)
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

    async courtLogic() {
        const resp = await this.api.chatCompletion(this.courtMem.toJSON())
        const msg = new mem.Message({
            content: resp.message.role,
            role: 'system'
        })
        this.courtMem.insert(msg)

        return msg
    }

    AddMsg(msgjson: MessageJSONOptions): boolean {
        if (!this.allow_new_user_message)
            return false;

        const courtMem = this.courtMem
        const user = this.userParticipant;

        const msg = courtMem.deserializeMessage(msgjson)
        msg.participant = user

        courtMem.insert(msg)
        return true
    }

    async GenerateAIResponse(): Promise<void> {
        const api = this.api
        const courtMem = this.courtMem
        
        if (this.game_state === "court") {
            // generate AI response and add to court memory.
            const resp: BaseAPIChatResponse = await api.chatCompletion(courtMem.toJSON())
            const message: mem.Message = new mem.Message({
                content: resp.message.content,
                participant: this.testAssistant
            })
            courtMem.insert(message)
        }
        
    }

    reset() {
        this.courtMem.clearAll()
    }
}