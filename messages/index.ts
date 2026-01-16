

import { z } from "@zod/zod"
import { buffer } from "node:stream/consumers";

export const MessageJsonOptionsScheme = z.object({
    content: z.string(),
    role: z.string().optional(),
    participantId: z.string().optional(),
    participantName: z.string().optional(),
    uuid: z.string().optional(),
    timestamp: z.string().optional()
}).refine(
  (data) => data.participantId || data.participantName, 
  {
    message: "Either participantId or participantName must be provided",
    path: ["participantId"], // point error to field
  }
);

///
// ENDPOINT RECEIVING DATA SCEMES //
///

export const getMessageBufferContentScheme = z.object({
  buffer_name: z.string()
})

export const newUserMessageScheme = MessageJsonOptionsScheme.extend({
  bufferName: z.string(),
})