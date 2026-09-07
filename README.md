# Jatayu The Ai

Jatayu The Ai is a responsive AI chat application built with React, TypeScript and Vite. It now integrates the open-source [OmniRoute](https://github.com/diegosouzapw/OmniRoute) gateway directly as a runtime dependency so Jatayu can run as one full-stack Node service instead of requiring a separately coded AI proxy.

## Why the GitHub Pages chat previously failed

GitHub Pages only serves static files. The frontend calls `/api/chat` and `/api/models`, but Pages cannot execute those API routes. The earlier architecture expected a separately deployed Worker plus a separately deployed OmniRoute server. If `VITE_API_BASE_URL` was not configured to that backend, the browser called the GitHub Pages origin itself and received an error.

The repository now supports two deployment modes:

```text
Recommended full-stack mode
Browser
  -> Jatayu Node server :8080
      -> /api/chat and /api/models
      -> embedded OmniRoute runtime :20128
      -> available AI provider/model

Optional static Pages mode
GitHub Pages frontend
  -> VITE_API_BASE_URL
      -> separately hosted Jatayu/OmniRoute backend
```

## OmniRoute integration

The npm package `omniroute@3.8.50` is a production dependency. `server/jatayu-server.mjs` can start the installed OmniRoute runtime automatically and proxy Jatayu's same-origin API routes to OmniRoute's OpenAI-compatible endpoints:

- `GET /api/models` -> OmniRoute `GET /v1/models`
- `POST /api/chat` -> OmniRoute `POST /v1/chat/completions`
- `GET /api/health` -> verifies OmniRoute is reachable

By default the embedded OmniRoute instance runs only on `127.0.0.1:20128`; Jatayu is the public-facing process. If `OMNIROUTE_BASE_URL` is set, Jatayu uses that external OmniRoute instance instead of starting its own.

## Requirements

- Node.js 22+
- npm 10+

## Run locally as one full-stack app

```bash
npm install
VITE_BASE_PATH=/ npm run build
npm run start:fullstack
```

Then open:

```text
http://localhost:8080
```

Health check:

```text
http://localhost:8080/api/health
```

OmniRoute supports multiple provider types, including no-auth/free providers, OAuth providers and API-key providers. Provider availability, quotas and upstream terms can change. Configure or enable the providers you want through OmniRoute as appropriate.

## Docker deployment

The included `Dockerfile` builds the frontend and launches Jatayu with the integrated OmniRoute runtime:

```bash
docker build -t jatayu-the-ai .
docker run --rm -p 8080:8080 -v jatayu-omniroute:/data/omniroute jatayu-the-ai
```

For a persistent production deployment, set fixed strong values for `JWT_SECRET` and `API_KEY_SECRET` rather than relying on per-process generated development values.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` / `JATAYU_PORT` | Public Jatayu server port, default `8080` |
| `OMNIROUTE_PORT` | Embedded OmniRoute port, default `20128` |
| `OMNIROUTE_DATA_DIR` | Persistent OmniRoute data directory |
| `OMNIROUTE_BASE_URL` | Optional external OmniRoute URL; disables embedded startup |
| `OMNIROUTE_API_KEY` | Optional bearer key for a protected external OmniRoute server |
| `OMNIROUTE_REQUIRE_API_KEY` | Embedded OmniRoute `/v1` auth mode; default `false` because it binds to loopback |
| `JWT_SECRET` | OmniRoute dashboard/session signing secret |
| `API_KEY_SECRET` | OmniRoute API-key encryption secret |
| `VITE_API_BASE_URL` | Frontend API origin; blank means same origin |
| `VITE_BASE_PATH` | Frontend asset base; `/` for full-stack, `/Jatayu-The-Ai/` for Pages |

Never put provider credentials or OmniRoute secrets in `VITE_*` variables because Vite embeds them into browser JavaScript.

## GitHub Pages

GitHub Pages remains useful as a static frontend, but it cannot run OmniRoute or the Jatayu Node server. The Pages workflow builds with `/Jatayu-The-Ai/` as the asset base. For chat to work on that static URL, define the repository variable `VITE_API_BASE_URL` as the HTTPS URL of a deployed Jatayu full-stack/backend service.

If no backend URL is configured, the UI can load but AI requests cannot succeed. This is a GitHub Pages platform limitation, not a frontend rendering problem.

## Optional Cloudflare Worker adapter

`worker/src/index.ts` is retained as an alternative adapter for users who already run OmniRoute elsewhere. It is no longer the only supported backend architecture.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

## Project structure

```text
src/                    React/Vite chatbot frontend
server/jatayu-server.mjs Full-stack Node server and OmniRoute integration
worker/src/              Optional Cloudflare Worker adapter
public/                  PWA assets
Dockerfile               Single-service full-stack deployment
THIRD_PARTY_NOTICES.md   Open-source attribution
```

## Security notes

- Embedded OmniRoute binds to loopback by default; expose Jatayu, not port 20128.
- Use HTTPS in production.
- Persist OmniRoute data on a protected volume.
- Use fixed strong `JWT_SECRET` and `API_KEY_SECRET` values for persistent deployments.
- If using an external protected OmniRoute instance, keep `OMNIROUTE_API_KEY` server-side only.
- Do not commit `.env`, provider keys or generated OmniRoute data.

## Third-party attribution

Jatayu The Ai integrates **OmniRoute**, created and maintained by `diegosouzapw` and contributors, under the **MIT License**. Upstream project: https://github.com/diegosouzapw/OmniRoute

See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for the attribution notice. Jatayu The Ai is an independent project and is not represented as an official OmniRoute product.
