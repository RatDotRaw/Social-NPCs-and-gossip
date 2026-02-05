import { CreateMessageBufferScheme, ReadMessageBufferScheme, NewUserMessageScheme, NewParticipantScheme } from "../messages/index.ts";
import GameState from "./gamestate.ts";
import { ServerResponse } from "../types.ts";
import { Console } from "node:console";

// Define what a handler looks like
type MessageHandler = (
  socket: WebSocket, 
  session: GameState, 
  data: any
) => Promise<void> | void;

// [x] create buffer by key
// [x] read buffer by key
// [x] get all buffer keys
// [x] add message to buffer by key
// [x] create participant by name
// [x] get all participant info.
// [ ] add gossip
// [ ] get all gossip
// [ ] start gossip propagation
// [ ] generate AI response


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
    const msgBuffList: string[] = session.getAllMessageBufferKeys()
    sendResponseWithType(socket, "message_buffer_names", msgBuffList)
  },

  "get_all_participant_info": (socket, session, _data) => {
    const results = session.getAllParticipantInfo()
    sendResponseWithType(socket, "participants_info", results)
  },
  //#endregion

  "create_participant": (socket, session, data) => {
    const safeData = NewParticipantScheme.safeParse(data)
    if (safeData.success) {
      console.log(`[new_user_message] Adding message to ${session.id}`);
      const {name, personaId} = safeData.data
      session.createNewParticipant(name, personaId);
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
  },

  //#region Chat message buffer calls
  // [x]
  "add_message": (socket, session, data) => {
    const safeData = NewUserMessageScheme.safeParse(data)
    if (safeData.success) {
      console.log(`[new_user_message] Adding message to ${session.id}`);
      const {bufferName, content, role, participantName} = safeData.data
      
      session.addMsgToBuffer(bufferName, participantName, role, content);
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
  },

  /**
   * [x] get contents of messager buffer
   * example call:
   * {
   *   "type": "get_message_buffer",
   *   "bufferName": "buffer"
   * }
   */
  "read_message_buffer": (socket, session, data) => {
    console.log(`[get_court_status] ${session.id}`)
    const safeData = ReadMessageBufferScheme.safeParse(data)
    if (safeData.success) { 
      const bufferName = safeData.data.bufferName
      sendResponseWithType(socket, "message_buffer_content",
        session.getMessageBufferMessages(bufferName)
      )
    }
  },

  /**
   * [x] Create new message buffer
   * example call:
   * {
   *   "type": "create_message_buffer",
   *   "bufferName": "buffer"
   * }
   */
  "create_message_buffer": (socket, session, data) => {
    const safeData = CreateMessageBufferScheme.safeParse(data)
    if (safeData.success) {
      const name = safeData.data.bufferName
      try {
        session.createMessageBuffer(name)
      } catch (e) {
        sendResponseWithType(socket, "error", String(e))
      }
    } else {
      sendResponseWithType(socket, "error", safeData.error)
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