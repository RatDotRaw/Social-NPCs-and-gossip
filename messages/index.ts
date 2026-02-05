

import { z } from "@zod/zod"
import { buffer } from "node:stream/consumers";

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

//#endregion
