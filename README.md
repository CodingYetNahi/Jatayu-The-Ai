# Jatayu The Ai

Jatayu The Ai is a responsive, installable AI chat client with local conversation history and streamed answers. It uses a secure Cloudflare Worker adapter to reach an [OmniRoute](https://github.com/diegosouzapw/OmniRoute) deployment through its OpenAI-compatible API. The browser never receives the OmniRoute credential or privileged upstream URL.

## Architecture

```text
Browser (React/Vite on GitHub Pages)
  -> HTTPS /api/chat or /api/models
Cloudflare Worker (validation, CORS, limits, secrets)
  -> /v1/chat/completions or /v1/models
OmniRoute -> selected available provider -> streamed SSE response
```

The UI defaults to `model: "auto"`. `src/api` owns browser transport, while `worker/src/index.ts` is the provider-neutral security boundary. Conversations and theme preference stay in browser local storage. Markdown is rendered as a React tree; embedded raw HTML is skipped. A future retrieval implementation can implement `SearchProvider` in `src/services/search.ts`; no browsing or citations are simulated today.

## Requirements and local development

- Node.js 22 or newer
- npm 10+
- A running OmniRoute-compatible server

```bash
npm install
cp .env.example .env
npm run dev
```

In a second terminal, start the API adapter:

```bash
export OMNIROUTE_BASE_URL=http://localhost:8080
export OMNIROUTE_API_KEY=your-local-key
export ALLOWED_ORIGIN=http://localhost:5173
npx wrangler dev
```

Set `VITE_API_BASE_URL=http://localhost:8787` in `.env`. This value is intentionally public and must point to the adapter—not OmniRoute.

## OmniRoute setup

Follow OmniRoute's upstream README to clone it, configure its provider keys on the server, install its dependencies, and launch it. Confirm that its OpenAI-compatible `/v1/models` and `/v1/chat/completions` endpoints are reachable from the Worker. For a remote instance, set `OMNIROUTE_BASE_URL` to its HTTPS origin (without `/v1`) and store its access token as `OMNIROUTE_API_KEY`. Provider keys belong only in OmniRoute's environment.

## Environment variables

| Variable | Location | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend build | Public origin of the secure adapter |
| `VITE_BASE_PATH` | Frontend build | Optional Pages base; defaults to `/Jatayu-The-Ai/` |
| `OMNIROUTE_BASE_URL` | Worker | Private OmniRoute origin |
| `OMNIROUTE_API_KEY` | Worker secret | OmniRoute bearer credential |
| `ALLOWED_ORIGIN` | Worker | Exact permitted frontend origin |

Never prefix a secret with `VITE_`: Vite embeds such variables in public JavaScript.

## Validation and production builds

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Deploy the backend

Cloudflare Workers has a free tier. Review `wrangler.toml`, set the production Pages origin and upstream URL, then store the key and deploy:

```bash
npx wrangler secret put OMNIROUTE_API_KEY
npx wrangler deploy
```

For production, enable a Workers Rate Limiting binding named `RATE_LIMITER` or put equivalent limits in front of the Worker. The adapter already enforces exact-origin CORS, message shape/count limits, per-message limits, a 128 KB declared request cap, safe errors, and `no-store` responses. Keep OmniRoute private where practical and rotate leaked credentials.

## Deploy the frontend to GitHub Pages

The workflow in `.github/workflows/deploy.yml` installs the pinned direct dependencies, then runs typecheck, tests, and build before deploying `dist`. The repository slug is `Jatayu-The-Ai`, so Vite uses `/Jatayu-The-Ai/`. In repository settings, choose **GitHub Actions** as the Pages source and define the non-secret repository variable `VITE_API_BASE_URL` with the deployed Worker origin. No backend secrets are used in this workflow.

## Project structure

```text
src/api           frontend chat/model transport and parsing
src/components    accessible chat interface components
src/config        single assistant prompt definition
src/hooks         theme behavior
src/services      future provider contracts
src/stores        validated local persistence
src/types         shared domain types
src/utils         message utilities
worker/src        Cloudflare Worker security adapter
public            PWA manifest, original icon, service worker
```

## Security notes

- Treat frontend code and `VITE_*` variables as public.
- Use HTTPS for both deployed adapter and OmniRoute.
- Configure `ALLOWED_ORIGIN` exactly; do not use `*` with privileged APIs.
- The service worker bypasses `/api/` and never caches AI responses.
- Raw model output is not interpreted as HTML. Links open with `noopener noreferrer`.
- Local conversation data is not encrypted; do not enter sensitive information on a shared device.
- Run `npm audit` regularly and review dependency updates before merging.

## Troubleshooting

- **“couldn’t reach the AI service”**: verify the Worker URL, deployment status, HTTPS, and browser network panel.
- **403 Origin not allowed**: make `ALLOWED_ORIGIN` exactly match the Pages origin, including scheme and without a trailing slash.
- **Model list unavailable**: chat remains functional with Auto; inspect Worker and OmniRoute `/v1/models` logs.
- **Authentication error**: reset the Worker secret and verify OmniRoute's expected bearer token.
- **Pages assets 404**: keep `VITE_BASE_PATH=/Jatayu-The-Ai/`, or change it to the actual repository slug including leading/trailing slashes.
- **Local CORS failure**: use `http://localhost:5173` for `ALLOWED_ORIGIN` and access Vite using that same host.

Optional next steps include a real search provider, authenticated encrypted sync, an attachment-processing backend, richer syntax highlighting, and browser-native voice input.
