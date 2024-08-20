// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
    id: string;
    name?: string;
    email: string;
    password: string;
    error?:string
  };

export interface Conversation {
  id: number;
  user: number; // user ID
  started_at: string; // ISO date string
  ended_at?: string;  // ISO date string, optional
}

export interface Message {
  id: number;
  conversation: number; // conversation ID
  sender: 'user' | 'bot';
  content: string;
  timestamp: string; // ISO date string
}