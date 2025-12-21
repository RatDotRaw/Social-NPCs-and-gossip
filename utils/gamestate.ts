import { api, mem, MessageJSONOptions } from "@dialogic";


export default class GameState {
    id: string
    private api: api.BaseAPI

    userParticipant: mem.Participant
    testAssistant: mem.Participant

    courtMem = new mem.MessageBuffer

    constructor(id: string, apiProvider: api.BaseAPI) {
        this.id = id
        this.api = apiProvider

        this.userParticipant = new mem.Participant("You", "user")
        this.testAssistant = new mem.Participant("TestAssistant", "assistant")

        // add user participant
        this.courtMem.participants.add(this.userParticipant)
        this.courtMem.participants.add(this.testAssistant)
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

    courtAddMsg(msgjson: MessageJSONOptions) {
        const courtMem = this.courtMem
        const user = this.userParticipant;

        const msg = courtMem.deserializeMessage(msgjson)
        msg.participant = user

        // for testing only
        const testMsg = new mem.Message({
            content: "resp.message.role",
            role: 'system',
            participant: this.testAssistant
        })
        
        courtMem.insert(msg)
        courtMem.insert(testMsg)
        console.log(courtMem.toJSON())
    }

    reset() {
        this.courtMem.clearAll()
    }
}