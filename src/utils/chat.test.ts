import { describe, expect, it } from 'vitest'; import { conversationTitle, createMessage } from './chat';
describe('message formatting', () => { it('trims messages', () => expect(createMessage('user','  hello  ').content).toBe('hello')); it('creates compact titles', () => expect(conversationTitle('  a   useful prompt  ')).toBe('a useful prompt')); });
