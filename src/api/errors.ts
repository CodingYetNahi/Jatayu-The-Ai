export class ChatApiError extends Error { constructor(public code: string, message: string, public status?: number) { super(message); } }
export function normalizeError(error: unknown): ChatApiError {
  if (error instanceof ChatApiError) return error;
  if (error instanceof DOMException && error.name === 'AbortError') return new ChatApiError('aborted', 'Generation stopped.');
  if (!navigator.onLine) return new ChatApiError('offline', 'You appear to be offline. Check your connection and try again.');
  return new ChatApiError('network', 'Jatayu couldn’t reach the AI service. Please try again.');
}
