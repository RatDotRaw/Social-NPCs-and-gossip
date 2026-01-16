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

    getTranscript(targetParticipantName: string): Message[] {
        if (!this.participants.has(targetParticipantName)) {
            throw new Error(
                `Target participant "${targetParticipantName}" not found.`
            );
        }

        return this.messages.map((msg) => {
            const isSelf = msg.participantName === targetParticipantName;
            return {
                ...msg,
                role: isSelf ? "assistant" : "user",
                content: isSelf ? msg.content:`[${msg.participantName}]: ${msg.content}`,
            };
        });
    }
    //#endregion
}
