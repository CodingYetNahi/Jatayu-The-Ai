import type { Conversation } from '../types/chat';
const KEY = 'jatayu:conversations:v1';
export const conversationStore = {
  load(storage: Pick<Storage, 'getItem'> = localStorage): Conversation[] {
    try { const value: unknown = JSON.parse(storage.getItem(KEY) ?? '[]'); return Array.isArray(value) ? value.filter(isConversation) : []; } catch { return []; }
  },
  save(items: Conversation[], storage: Pick<Storage, 'setItem'> = localStorage) { storage.setItem(KEY, JSON.stringify(items)); },
};
function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Conversation>;
  return typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.messages) && typeof item.updatedAt === 'number' && typeof item.createdAt === 'number' && typeof item.selectedModel === 'string';
}
