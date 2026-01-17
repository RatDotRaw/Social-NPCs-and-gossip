import { Message, roles } from "../dialogManager/types.ts"


export default class GameState {
    id: string

    messageBufferRecords: Record<string, Message[]> = {}
    participantsList: Set<string> = new Set()

    // --- syncing settings ---
    is_busy = false
    is_ai_bussy = false;
    allow_request: boolean = true
    allow_new_user_message: boolean = true

    constructor(id: string) {
        this.id = id

        // some default entries
        this.participantsList.add("user")
        this.participantsList.add("assistant")
        this.createMessageBuffer("buffer")
    }

    //#region participants logic
    createNewParticipant(name: string) {
        if (this.participantsList.has(name)) {
            throw new Error("Participant name already exists")
        } else {
            this.participantsList.add(name)
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
        return contents
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
        if (!this.participantsList.has(participantName)) {
            throw Error("Participant name not found")
        }

        const newMsg: Message = {
            content: messageContent,
            participantName: participantName,
            role: role
        }
        buff.push(newMsg)
    }

    getMessageBufferContent(name: string) {
        const buff = this.findMessageBuffer(name)
        return [...buff]
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