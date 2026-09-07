import type { ChatMessage } from '../types/chat';
export const makeId = () => crypto.randomUUID();
export const createMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({ id: makeId(), role, content: content.trim(), createdAt: Date.now() });
export const conversationTitle = (text: string) => text.trim().replace(/\s+/g, ' ').slice(0, 42) || 'New conversation';
export const formatTime = (timestamp: number) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
