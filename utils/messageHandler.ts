import { MessageJsonOptionsScheme, getMessageBufferContentScheme, newUserMessageScheme } from "../messages/index.ts";
import GameState from "./gamestate.ts";
import { ServerResponse } from "../types.ts";
import { MessageJSONOptions } from "@dialogic";

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

  // get all message buffer names
  "get_message_buffer_names": (socket, session, _data) => {
    const msgBuffList: String[] = session.getAllMessageBufferKeys()
    sendResponseWithType(socket, "message_buffer_names", msgBuffList)
  },

  // get all participants info
  "get_participants_info": (socket, session, _data) => {
    const results = session.getAllParticpantInfo()
    sendResponseWithType(socket, "participants_info", results)
  },
  //#endregion

  //#region Chat message buffer calls
  "new_user_message": async (socket, session, data) => {
    const safeData = newUserMessageScheme.safeParse(data)
    if (safeData.success) {
      const { bufferName, ...messageOptions} = safeData.data

      console.log(`[new_user_message] Adding message to ${session.id}`);
      await session.AddMsg(bufferName, messageOptions);
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
  },

  // get all messages from a buffer
  "get_message_buffer_content": (socket, session, data) => {
    const safeData = getMessageBufferContentScheme.safeParse(data)

    if (safeData.success) {
      const buffName = safeData.data.buffer_name
      // before sending, remove unesesairy keys for easier debugging
      sendResponseWithType(socket, "status_court", {
        messages: session.getMessageBufferContent(buffName).map(({
          images,
          ...rest
        }) => {
          return rest
        })
      })
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
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