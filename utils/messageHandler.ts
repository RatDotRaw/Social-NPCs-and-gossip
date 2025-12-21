import { Session } from "node:inspector/promises";
import GameState from "./gamestate.ts";
import { Socket } from "node:dgram";

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
    sendResponse(socket, "ping", {})
  },

  "log": (socket, session, data) => {
    console.log(`[LOG][${session.id}]: ${data.content}`);
  },

  "new_user_message": async (socket, session, data) => {
    console.log(`Adding message to ${session.id}`);
    await session.courtAddMsg(data.content);
  },

  "get_court_status": (socket, session, _data) => {
    console.log(`[get_court_status] ${session.id}`)

    // before sending, remove unesesairy keys for easier debugging
    sendResponse(socket, "status_court", {
      court_messages: session.courtMem.toJSON().map(({
        images,
        ...rest
      }) => {
        return rest
      })
    })
  },

  "get_status": (socket, session, _data) => {
    sendResponse(socket, "status_update", {
      id: session.id,
      active: true,
      timestamp: Date.now()
    });
  }
};


function sendResponse(socket: WebSocket, type: string, payload: object) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, ...payload }));
  }
}