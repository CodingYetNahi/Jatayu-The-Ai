import { ChatApiError } from './errors';
export function parseStreamLine(line: string): string {
  const raw = line.replace(/^data:\s*/, '').trim();
  if (!raw || raw === '[DONE]') return '';
  try { const body = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> }; return body.choices?.[0]?.delta?.content ?? body.choices?.[0]?.message?.content ?? ''; }
  catch { throw new ChatApiError('malformed', 'The AI service returned an unreadable response.'); }
}
