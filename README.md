# Agritech AI

Mock-first Next.js web app for Kenyan smallholder farmers, agricultural experts, and administrators. The farmer portal complements USSD/SMS with maps, charts, market information, and service workflows. Demo records are illustrative, not live data or agronomic advice.

## Requirements

- Node.js and npm (see `package.json` for supported tooling).

## Install and run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000` and choose a demo Farmer, Expert, or Admin persona at `/login`. The Demo controls switch persona and success/empty/error scenarios. Mock mode is the default, makes no backend requests, and collects no PIN, password, or token.

## Environment

```env
NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_API_BASE_URL=https://YOUR-API-HOST
NEXT_PUBLIC_MOCK_DELAY_MS=80
```

`NEXT_PUBLIC_DATA_MODE` accepts `mock` or `api`; the API URL has no trailing slash. Never put secrets in frontend environment variables. Unconfirmed API adapters explicitly remain not implemented.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

See [docs/HANDOFF.md](./docs/HANDOFF.md) for the project map, phase history, screen coverage, and known gaps. For confirmed backend contracts and outstanding endpoints, see section F of [docs/missing-endpoints.md](./docs/missing-endpoints.md).

## Maps and offline use

Maps use OpenStreetMap public tiles for light use only. Production deployments need a tile provider or self-hosted tiles. A minimal service worker is registered in production builds only; dynamic/private pages and API/backend responses are not cached.
