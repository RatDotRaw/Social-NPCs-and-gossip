

import { z } from "@zod/zod"

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