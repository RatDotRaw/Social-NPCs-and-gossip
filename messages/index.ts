

import { z } from "@zod/zod"

const ROLES = ["user", "assistant", "system", "tool"] as const;

export const MessageJsonScheme = z.object({
    content: z.string(),
    role: z.enum(ROLES),
    participantName: z.string(),
})

//#region api data validation

export const NewUserMessageScheme = MessageJsonScheme.extend({
  bufferName: z.string(),
})

export const ReadMessageBufferScheme = z.object({
  bufferName: z.string()
})

export const CreateMessageBufferScheme = z.object({
  bufferName: z.string()
})

export const NewParticipantScheme = z.object({
  name: z.string(),
  personaId: z.string().optional()
})

export const GenerateAiResponseScheme = z.object({
  bufferName: z.string(),
  participantName: z.string(),
  addRespToBuffer: z.boolean()
})

export const GenerateSingleAiResponseScheme = z.object({
  participantName: z.string(),
  messages: z.array(MessageJsonScheme.extend({
    participantName: z.string().optional()
  }))
})

export const GenerateGossipFromMessageBuffer = z.object({
  bufferName: z.string(),
  personaId: z.string(),
  id: z.string().optional()
})

export const AddInjectedContext = MessageJsonScheme.extend({
  // hmmm, nothing to extend with XD
}).omit({
  participantName: true
})

export const PropagateGossip = z.object({
  gossipIds: z.array(z.string())
})
//#endregion
