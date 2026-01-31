import { Persona } from "../gossipEnge/types.ts";

export type roles = "user" | "assistant" | "system"| "tool"

export interface Participant {
  name: string;
  personaId?: string;
}

export interface Message {
  participant?: Participant;
  role: roles 
  content: string;
}