import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from 'axios';
import { Conversation, Message } from '@/lib/definitions';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE_URL = 'http://localhost:8000/api';

export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await axios.get<{data:Conversation[]}>(`${API_BASE_URL}/conversations/`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const fetchConversationsByUser = async (userId: string): Promise<Conversation[]> => {
  try {
    const response = await axios.get<{data:Conversation[]}>(`${API_BASE_URL}/conversations/?user=${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching conversations by user:', error);
    return [];
  }
};

export const fetchMessages = async (conversationId: number): Promise<Message[]> => {
  try {
    const response = await axios.get<Message[]>(`${API_BASE_URL}/messages/?conversation=${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const fetchMessagesByConversation = async (conversationId: number): Promise<Message[]> => {
  try {
    const response = await axios.get<{data:Message[]}>(`${API_BASE_URL}/messages/?conversation=${conversationId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching messages by conversation:', error);
    return [];
  }
};
