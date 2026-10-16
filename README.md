# Agritech AI

Agritech AI is a mock-first Next.js web app for Kenyan smallholder farmers, agricultural experts, and administrators. It complements USSD/SMS with maps, charts, market information, and service workflows. Demo records are illustrative, not live data or agronomic advice.

## Requirements

- Node.js and npm (see `package.json` for supported tooling).

## Install and run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000` and choose a demo Farmer, Expert, or Admin persona at `/login`. The Demo controls switch persona and success/empty/error scenarios. Mock mode is the development default, makes no backend requests, and collects no PIN, password, or token.

## Environment

```env
NEXT_PUBLIC_DATA_MODE=mock
API_URL=https://YOUR-API-HOST
NEXT_PUBLIC_MOCK_DELAY_MS=80
```

`NEXT_PUBLIC_DATA_MODE` accepts `mock` or `api`. `API_URL` is server-only, has no trailing slash, and is used by the same-origin `/backend` proxy; do not add it to a `NEXT_PUBLIC_*` variable. Never put secrets in frontend environment variables. Unconfirmed API adapters explicitly remain not implemented. Production configuration and the connected API routes are documented in [docs/HANDOFF.md](./docs/HANDOFF.md).

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

The Playwright suite runs against a production build on port 3100 using `.next-e2e`. See [docs/HANDOFF.md](./docs/HANDOFF.md) for the project map, phase history, screen coverage, release status, and known gaps. For confirmed backend contracts and outstanding endpoints, see section F of [docs/missing-endpoints.md](./docs/missing-endpoints.md).

## Maps and offline use

Maps use OpenStreetMap public tiles for light use only. Production deployments need a tile provider or self-hosted tiles. A minimal service worker is registered in production builds only; dynamic/private pages and API/backend responses are not cached.
