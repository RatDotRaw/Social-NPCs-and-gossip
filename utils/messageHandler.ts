import { MessageJsonOptionsScheme } from "../messages/index.ts";
import GameState from "./gamestate.ts";
import { ServerResponse } from "../types.ts";

// Define what a handler looks like
type MessageHandler = (
  socket: WebSocket, 
  session: GameState, 
  data: any
) => Promise<void> | void;

// Create the registry
export const messageHandlers: Record<string, MessageHandler> = {
  "ping": (socket, session, _data) => {
    console.log(`[PING][${session.id}]`)
    sendResponseWithType(socket, "ping", "pong")
  },

  //#region Server info
  // get server session status
  "get_status": (socket, session, _data) => {
    // console.log(`[get_status] ${session.id}`)
    sendResponseWithType(socket, "status_update", { state: session.get_state() });
  },

  "get_message_buffer_names": (socket, session, _data) => {
    const msgBuffList: String[] = session.getAllMessageBufferKeys()
    sendResponseWithType(socket, "message_buffer_names", msgBuffList)
  },

  "get_all_participant_info": (socket, session, _data) => {
    const results = session.getAllParticpantInfo()
    sendResponseWithType(socket, "participants_info", results)
  },
  //#endregion

  //#region Chat message buffer calls
  "new_user_message": async (socket, session, data) => {
    const safeData = MessageJsonOptionsScheme.safeParse(data)
    if (safeData.success) {
      console.log(`[new_user_message] Adding message to ${session.id}`);
      await session.AddMsg(data.data);
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
  },

  "get_message_buffer": (socket, session, data) => {
    // console.log(`[get_court_status] ${session.id}`)

    // before sending, remove unesesairy keys for easier debugging
    sendResponseWithType(socket, "status_court", {
      court_messages: session.courtMem.toJSON().map(({
        images,
        ...rest
      }) => {
        return rest
      })
    })
  },

  "create_message_buffer": (socket, session, data) => {
    const name = data
    try {
      const result = session.createMessageBuffer(name)

    } catch {

    }
  },
  //#endregion

  "request_AI_response": async (socket, session, _data) => {
    console.log(`[request_AI_response] ${session.id}`)
    await session.GenerateAIResponse()
  }
};


// function sendResponseWithId(socket: WebSocket, id: string, payload: object) {
//   if (socket.readyState === WebSocket.OPEN) {
//     socket.send(JSON.stringify({ id, data: payload }));
//   }
// }

function sendResponseWithType(socket: WebSocket, msgType: string, msgBody: any) {
  if (socket.readyState === WebSocket.OPEN) {
    const resp: ServerResponse = {
      type: msgType,
      body: msgBody
    }

    socket.send(JSON.stringify(resp));
  }
}