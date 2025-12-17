import { api, mem, MessageJSONOptions } from "@dialogic";

export default class GameState {
    id: string
    private api: api.BaseAPI

    courtMem = new mem.MessageBuffer

    constructor(id: string, apiProvider: api.BaseAPI) {
        this.id = id
        this.api = apiProvider

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
        const msg = courtMem.deserializeMessage(msgjson)
        courtMem.insert(msg)
    }

    reset() {
        this.courtMem.clearAll()
    }
}