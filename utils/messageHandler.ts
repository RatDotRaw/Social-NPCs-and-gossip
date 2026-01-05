import { Session } from "node:inspector/promises";
import GameState from "./gamestate.ts";
import { Socket } from "node:dgram";
import { request } from "node:http";
import { privateEncrypt } from "node:crypto";

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

  // get server session status
  "get_status": (socket, session, _data) => {
    // console.log(`[get_status] ${session.id}`)
    sendResponseWithType(socket, "status_update", { state: session.get_state() });
  },

  "new_user_message": async (socket, session, data) => {
    console.log(`[new_user_message] Adding message to ${session.id}`);
    await session.AddMsg(data.data);
  },

  "get_court_status": (socket, session, _data) => {
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
};


function sendResponseWithId(socket: WebSocket, id: string, payload: object) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id, data: payload }));
  }
}

function sendResponseWithType(socket: WebSocket, type: string, payload: object) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data: payload }));
  }
}