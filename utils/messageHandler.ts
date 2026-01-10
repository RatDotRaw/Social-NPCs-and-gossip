import { Session } from "node:inspector/promises";
import GameState from "./gamestate.ts";
import { Socket } from "node:dgram";
import { request } from "node:http";
import { privateEncrypt } from "node:crypto";
import { ServerResponse } from "../types.ts";

// Define what a handler looks like
type MessageHandler = (
  socket: WebSocket, 
  session: GameState, 
  data: any
) => Promise<void> | void;

// Create the registry
export const messageHandlers: Record<string, MessageHandler> = {
  "ping": (socket, session, data) => {
    console.log(`[PING][${session.id}]`)
    sendResponseWithType(socket, "ping", {})
  },

  //#region Server info
  // get server session status
  "get_status": (socket, session, _data) => {
    // console.log(`[get_status] ${session.id}`)
    sendResponseWithType(socket, "status_update", { state: session.get_state() });
  },

  "get_message_buffer_names": (socket, session, data) => {
    const msgBuffList: String[] = session.getAllMessageBufferKeys()
    sendResponseWithType(socket, "message_buffer_names", msgBuffList)
  },

  "get_all_participant_names": (socket, session, data) => {
    const results = session.getAllParticpantInfo()
    sendResponseWithType(socket, "participants_info", results)
  },

  //#endregoin

  //#region Chat message buffer calls
  "new_user_message": async (socket, session, data) => {
    console.log(`[new_user_message] Adding message to ${session.id}`);
    await session.AddMsg(data.data);
  },

  "get_message_buffer": (socket, session, _data) => {
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

  "request_AI_response": async (socket, session, _data) => {
    console.log(`[request_AI_response] ${session.id}`)
    await session.GenerateAIResponse()
  }
  //#endregion
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