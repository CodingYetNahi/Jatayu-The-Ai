# Jatayu OmniRoute runtime

This directory contains the runtime-only dependency set for Jatayu's full-stack server.

Install it separately from the frontend:

```bash
npm install --prefix server
```

The frontend/GitHub Pages build intentionally does not install OmniRoute. The full-stack server launches the `omniroute` binary from `server/node_modules/.bin` when `OMNIROUTE_BASE_URL` is not provided.
