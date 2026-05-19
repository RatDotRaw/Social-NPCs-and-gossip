import { Message } from "./types.ts";

export class MessageBuffer {
    participants: Set<string> = new Set();
    messages: Message[] = [];

    constructor(participantNames?: Set<string>) {
        if (participantNames) {
            this.participants = participantNames;
        }
    }

    //#region participants logic
    addParticipant(name: string) {
        try {
            this.participants.add(name);
        } catch (e) {
            throw new Error("Participant name already exists: " + e);
        }
    }

    getParticipants() {
        return this.participants
    }
    //#endregion

    //#region messages logic
    addMessage(message: Message) {
        this.messages.push(message);
    }

    getMessages() {
        return this.messages
    }
    //#endregion
}
