export interface Env { OMNIROUTE_BASE_URL: string; OMNIROUTE_API_KEY: string; ALLOWED_ORIGIN: string; RATE_LIMITER?: { limit(input: { key: string }): Promise<{ success: boolean }> } }
const MAX_BYTES = 128_000;
export default { async fetch(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin') ?? ''; const headers = cors(origin, env.ALLOWED_ORIGIN);
  if (request.method === 'OPTIONS') return origin === env.ALLOWED_ORIGIN ? new Response(null, { status: 204, headers }) : safe('Origin not allowed', 403, headers);
  if (!env.OMNIROUTE_BASE_URL || !env.OMNIROUTE_API_KEY) return safe('AI service is not configured', 503, headers);
  if (origin !== env.ALLOWED_ORIGIN) return safe('Origin not allowed', 403, headers);
  const url = new URL(request.url); if (!['/api/chat','/api/models'].includes(url.pathname)) return safe('Not found', 404, headers);
  if (env.RATE_LIMITER && !(await env.RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' })).success) return safe('Too many requests', 429, headers);
  try {
    const upstreamBase = env.OMNIROUTE_BASE_URL.replace(/\/$/, '');
    if (url.pathname === '/api/models' && request.method === 'GET') return proxy(await fetch(`${upstreamBase}/v1/models`, { headers: auth(env) }), headers);
    if (url.pathname !== '/api/chat' || request.method !== 'POST') return safe('Method not allowed', 405, headers);
    const length = Number(request.headers.get('content-length') ?? 0); if (length > MAX_BYTES) return safe('Request too large', 413, headers);
    const raw = await request.text(); if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) return safe('Request too large', 413, headers);
    let body: unknown; try { body = JSON.parse(raw); } catch { return safe('Invalid JSON', 400, headers); }
    if (!validChat(body)) return safe('Invalid chat request', 400, headers);
    const payload = body as { model?: string; messages: Array<{ role: string; content: string }> };
    const upstream = await fetch(`${upstreamBase}/v1/chat/completions`, { method: 'POST', headers: { ...auth(env), 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ model: payload.model || 'auto', messages: payload.messages, stream: true }) });
    return proxy(upstream, headers);
  } catch { return safe('AI service unavailable', 502, headers); }
} };
function auth(env: Env) { return { Authorization: `Bearer ${env.OMNIROUTE_API_KEY}` }; }
function cors(origin: string, allowed: string) { const h = new Headers({ 'Vary':'Origin','X-Content-Type-Options':'nosniff','Cache-Control':'no-store' }); if (origin === allowed) { h.set('Access-Control-Allow-Origin', origin); h.set('Access-Control-Allow-Methods','GET, POST, OPTIONS'); h.set('Access-Control-Allow-Headers','Content-Type'); } return h; }
function safe(message: string, status: number, headers: Headers) { headers.set('Content-Type','application/json'); return new Response(JSON.stringify({ error: { message } }), { status, headers }); }
function proxy(response: Response, corsHeaders: Headers) { const headers = new Headers(response.headers); corsHeaders.forEach((value,key) => headers.set(key,value)); headers.set('Cache-Control','no-store'); return new Response(response.body, { status: response.status, headers }); }
function validChat(value: unknown): boolean { if (!value || typeof value !== 'object') return false; const messages = (value as { messages?: unknown }).messages; return Array.isArray(messages) && messages.length > 0 && messages.length <= 200 && messages.every(m => m && typeof m === 'object' && ['system','user','assistant'].includes((m as {role?:string}).role ?? '') && typeof (m as {content?:unknown}).content === 'string' && (m as {content:string}).content.length <= 16000); }
