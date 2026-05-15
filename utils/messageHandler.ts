// deno-lint-ignore-file no-explicit-any
import { CreateMessageBufferScheme, ReadMessageBufferScheme, NewUserMessageScheme, NewParticipantScheme, GenerateAiResponseScheme, GenerateGossipFromMessageBuffer, PropagateGossip } from "../messages/index.ts";
import GameState from "./gamestate.ts";
import { ServerResponse } from "../types.ts";
import { generateParticipantResponse } from "./ollamaHelpers.ts";
import { Message } from "../dialogManager/types.ts";
import { Gossip } from "../gossipEnge/types.ts";

// Define what a handler looks like
type MessageHandler = (
  socket: WebSocket, 
  session: GameState, 
  data: any
) => Promise<void> | void;

// [x] create buffer by key
// [x] create participant by name
// [x] create new message in buffer by key
// [ ] create gossip
// [x] get all buffer keys
// [x] get all participant info.
// [x] get buffer by key
// [x] get all gossip
// [x] generate AI response
// [x] generate gossip from message buffer
// [ ] start gossip propagation


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

  // [x] get all message buffer names
  "get_message_buffer_keys": (socket, session, _data) => {
    const msgBuffList: string[] = session.getAllMessageBufferKeys()
    sendResponseWithType(socket, "message_buffer_names", msgBuffList)
  },

  // [x]
  "get_all_participant_info": (socket, session, _data) => {
    const results = session.getAllParticipantInfo()
    sendResponseWithType(socket, "participants_info", results)
  },
  //#endregion

  // [x]
  "create_participant": (socket, session, data) => {
    const safeData = NewParticipantScheme.safeParse(data)
    if (safeData.success) {
      console.log(`[create_participant] Creating new participant in ${session.id}:${safeData.data.name}`);
      try {
        const {name, personaId} = safeData.data
        session.createNewParticipant(name, personaId);
      } catch (_e) {
        sendResponseWithType(socket, "error", `Participant name already exists: ${data.name}`)
      }
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
  },

  //#region Chat message buffer calls
  // [x]
  "add_message": (socket, session, data) => {
    const safeData = NewUserMessageScheme.safeParse(data)
    if (safeData.success) {
      console.log(`[new_user_message] Adding message to ${session.id}::${safeData.data.participantName}::${safeData.data.bufferName}`);
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
        session.readMessageBuffer(bufferName)
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
        console.log(`${session.id}: creating message buffer: "${data.bufferName}"`)
        session.createMessageBuffer(name)
      } catch (e) {
        sendResponseWithType(socket, "error", String(e))
      }
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
  },
  //#endregion

  // [x]
  "get_all_gossip": (socket, session, _data) => {
    const gossip = session.getAllGossip()
    sendResponseWithType(socket, "get_all_gossip", gossip)
  },

  //region AI enpoints
  "generate_AI_response": async (socket, session, data) => {
    if (session.is_ai_busy) {
      sendResponseWithType(socket, "status_update", { state: session.get_state() });
      return
    }
    session.is_ai_busy = true

    const safeData = GenerateAiResponseScheme.safeParse(data)
    if (safeData.success) {
      const { bufferName, participantName, addRespToBuffer } = data
      console.log(`[generate_AI_response] ${session.id}, ${participantName}`)
      
      const participant = session.findParticipant(participantName)
      const messages = session.readMessageBuffer(bufferName)
      const persona = participant.personaId ? session.findPersonabyId(participant.personaId) : undefined

      // console.log(messages)
      const resp = await generateParticipantResponse(
        session.modelName, 
        participant,
        messages,
        persona
      )
      console.log(`resp;: ${resp?.slice(0, 64)} [${resp?.length}]`)

      const newMessage: Message = {
        role: "assistant",
        content: resp || '',
        participant: participant
      }

      if (addRespToBuffer) {
        session.addRawMsgToBuffer(bufferName, newMessage)
      }

      sendResponseWithType(socket, "generated_AI_response", newMessage)
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
    session.is_ai_busy = false
  },

  "generate_gossip_from_message_buffer": async (socket, session, data) => {
    session.is_ai_busy = true

    const safeData = GenerateGossipFromMessageBuffer.safeParse(data)
    if (safeData.success) {
      const { bufferName, personaId, id} = safeData.data
      console.log(`[generate_gossip_from_message_buffer] ${session.id}::${bufferName}::${personaId}`)

      try {
        const resp: Gossip = await session.summarizeMessageBufferToGossip(bufferName, personaId)
        console.log(`resp;:${id} ${resp.belief} :: ${resp.content.slice(0, 64)} [${resp.content.length}]`)
        sendResponseWithType(socket, "generate_gossip_from_message_buffer", resp, id)
      } catch (e) {
        sendResponseWithType(socket, "error", String(e), id)
        console.error(String(e))
      }
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
    session.is_ai_busy = false
  },

  "propagate_gossip": async (socket, session, data) => {
    session.is_ai_busy = true
    
    const safeData = PropagateGossip.safeParse(data)
    if (safeData.success) {
      const gossipIds: string[] = safeData.data.gossipIds
      try {
        const seedGossip = gossipIds
          .map(id => session.getGossipById(id))
          .filter((g): g is Gossip => g !== undefined)

        if (seedGossip.length === 0) {
          sendResponseWithType(socket, "error", "No valid gossip found for the provided IDs")
          session.is_ai_busy = false
          return
        }
        sendResponseWithType(socket, "gossipEngine_config", session.gossipEngine.getConfig())
        for await (const newGossip of session.propagateGossip(seedGossip)) {
          sendResponseWithType(socket, "propagate_gossip", newGossip)
        }
      } catch (e) {
        sendResponseWithType(socket, "error", String(e))
      }
    } else {
      sendResponseWithType(socket, "error", safeData.error)
    }
    session.is_ai_busy = false
  }

  //#endregion
};


// function sendResponseWithId(socket: WebSocket, id: string, payload: object) {
//   if (socket.readyState === WebSocket.OPEN) {
//     socket.send(JSON.stringify({ id, data: payload }));
//   }
// }

// function sendResponseWithType(socket: WebSocket, msgType: string, msgBody: any) {
//   if (socket.readyState === WebSocket.OPEN) {
//     const resp: ServerResponse = {
//       type: msgType,
//       body: msgBody
//     }

//     socket.send(JSON.stringify(resp));
//   }
// }

function sendResponseWithType(socket: WebSocket, msgType: string, msgBody: any, id?: string) {
  if (socket.readyState === WebSocket.OPEN) {
    const callerName = new Error().stack?.split('\n')[2]?.trim().split(' ')[1] ?? 'unknown';

    const resp: ServerResponse = {
      type: msgType,
      body: msgBody,
      callerName, // or whatever key you want
      id
    }
    socket.send(JSON.stringify(resp));
  }
}