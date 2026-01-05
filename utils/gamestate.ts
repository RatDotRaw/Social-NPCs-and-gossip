import { api, BaseAPIChatResponse, mem, MessageJSONOptions } from "@dialogic";


export default class GameState {
    id: string
    private api: api.BaseAPI

    userParticipant: mem.Participant
    testAssistant: mem.Participant

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

        this.userParticipant = new mem.Participant("You", "user")
        this.testAssistant = new mem.Participant("TestAssistant", "assistant")

        // add user participant
        this.courtMem.participants.add(this.userParticipant)
        this.courtMem.participants.add(this.testAssistant)
    }

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