export type roles = "user" | "assistant" | "system"| "tool"

export interface Message {
  participantName?: string;
  role: roles 
  content: string;
}