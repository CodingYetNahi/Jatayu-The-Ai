export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage { id: string; role: ChatRole; content: string; createdAt: number }
export interface Conversation { id: string; title: string; createdAt: number; updatedAt: number; messages: ChatMessage[]; selectedModel: string }
export interface Model { id: string; name: string }
