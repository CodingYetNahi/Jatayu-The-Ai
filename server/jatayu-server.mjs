import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || process.env.JATAYU_PORT || 8080);
const omniroutePort = Number(process.env.OMNIROUTE_PORT || 20128);
const externalOmniRoute = process.env.OMNIROUTE_BASE_URL?.replace(/\/$/, '');
const omniBase = externalOmniRoute || `http://127.0.0.1:${omniroutePort}`;
let omniProcess;

if (!externalOmniRoute) {
  const bin = process.platform === 'win32'
    ? path.join(root, 'node_modules', '.bin', 'omniroute.cmd')
    : path.join(root, 'node_modules', '.bin', 'omniroute');

  omniProcess = spawn(bin, ['--port', String(omniroutePort)], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(omniroutePort),
      HOSTNAME: '127.0.0.1',
      REQUIRE_API_KEY: process.env.OMNIROUTE_REQUIRE_API_KEY || 'false',
      AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE || 'false',
      DATA_DIR: process.env.OMNIROUTE_DATA_DIR || path.join(root, '.omniroute-data'),
    },
  });

  omniProcess.on('exit', code => {
    console.error(`OmniRoute exited with code ${code ?? 'unknown'}`);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/health') {
      const upstreamOk = await probeOmniRoute();
      return json(res, upstreamOk ? 200 : 503, {
        ok: upstreamOk,
        omniroute: upstreamOk ? 'reachable' : 'unreachable',
        mode: externalOmniRoute ? 'external' : 'embedded-runtime',
      });
    }

    if (url.pathname === '/api/models' && req.method === 'GET') {
      return proxy(req, res, '/v1/models');
    }

    if (url.pathname === '/api/chat' && req.method === 'POST') {
      return proxy(req, res, '/v1/chat/completions', true);
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: { message: 'Jatayu server error' } });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Jatayu The Ai listening on http://0.0.0.0:${port}`);
  console.log(`OmniRoute upstream: ${omniBase}`);
});

async function proxy(req, res, upstreamPath, forceStream = false) {
  const body = req.method === 'POST' ? await readBody(req, 128_000) : undefined;
  let parsedBody = body;

  if (forceStream && body) {
    try {
      const parsed = JSON.parse(body);
      parsed.stream = true;
      if (!parsed.model) parsed.model = 'auto';
      parsedBody = JSON.stringify(parsed);
    } catch {
      return json(res, 400, { error: { message: 'Invalid JSON' } });
    }
  }

  const headers = { Accept: forceStream ? 'text/event-stream' : 'application/json' };
  if (parsedBody) headers['Content-Type'] = 'application/json';
  if (process.env.OMNIROUTE_API_KEY) headers.Authorization = `Bearer ${process.env.OMNIROUTE_API_KEY}`;

  let upstream;
  try {
    upstream = await fetch(`${omniBase}${upstreamPath}`, {
      method: req.method,
      headers,
      body: parsedBody,
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    return json(res, 502, { error: { message: 'OmniRoute is unavailable' } });
  }

  res.statusCode = upstream.status;
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');

  if (!upstream.body) return res.end();
  const reader = upstream.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

async function probeOmniRoute() {
  try {
    const headers = process.env.OMNIROUTE_API_KEY ? { Authorization: `Bearer ${process.env.OMNIROUTE_API_KEY}` } : {};
    const response = await fetch(`${omniBase}/v1/models`, { headers, signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

function serveStatic(requestPath, res) {
  if (!fs.existsSync(dist)) return json(res, 503, { error: { message: 'Frontend build not found. Run npm run build first.' } });
  const safePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  let file = path.join(dist, safePath);
  if (!file.startsWith(dist)) return json(res, 403, { error: { message: 'Forbidden' } });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  const ext = path.extname(file);
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
  res.statusCode = 200;
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=3600');
  fs.createReadStream(file).pipe(res);
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(value));
}

function shutdown() {
  if (omniProcess && !omniProcess.killed) omniProcess.kill('SIGTERM');
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
