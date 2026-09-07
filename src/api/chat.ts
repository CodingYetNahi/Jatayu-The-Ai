import type { ChatMessage } from '../types/chat';
import { ChatApiError, normalizeError } from './errors';
import { parseStreamLine } from './stream';
const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
export async function streamChat(input: { model: string; messages: Pick<ChatMessage, 'role' | 'content'>[]; signal: AbortSignal; onToken: (text: string) => void }) {
  try {
    const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ model: input.model, messages: input.messages }), signal: input.signal });
    if (!response.ok) throw statusError(response.status);
    const type = response.headers.get('content-type') ?? '';
    if (!response.body || !type.includes('text/event-stream')) { const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }; const text = data.choices?.[0]?.message?.content; if (!text) throw new ChatApiError('malformed', 'The AI service returned an empty response.'); input.onToken(text); return; }
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    while (true) { const { done, value } = await reader.read(); buffer += decoder.decode(value, { stream: !done }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? ''; for (const line of lines) if (line.startsWith('data:')) input.onToken(parseStreamLine(line)); if (done) break; }
    if (buffer.startsWith('data:')) input.onToken(parseStreamLine(buffer));
  } catch (error) { throw normalizeError(error); }
}
function statusError(status: number) { if (status === 401 || status === 403) return new ChatApiError('auth', 'The AI service is not configured correctly.', status); if (status === 429) return new ChatApiError('rate_limit', 'Too many requests. Please wait a moment and retry.', status); if (status === 404) return new ChatApiError('model', 'That model is currently unavailable.', status); return new ChatApiError('service', 'Jatayu couldn’t reach the AI service. Please try again.', status); }
