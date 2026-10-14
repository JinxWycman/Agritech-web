# Agritech AI

Next.js App Router web application for the Agritech AI farmer, expert, and admin portals.

## Data modes and authentication

The default mode is mock:

```env
NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_MOCK_DELAY_MS=80
```

Mock mode does not send requests to the backend. Use the login persona picker or the in-app Demo controls to switch between the Farmer, Expert, and Admin personas and the success, empty, and error scenarios. All displayed records are deterministic sample data. Demo authorization is only a navigation aid, not security.

To try API adapters after configuring a compatible API:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_BASE_URL=https://YOUR-API-HOST
```

No trailing slash. The browser calls the same-origin Next.js `/backend/...` proxy; the frontend contains no API secret. Existing endpoint adapters preserve legacy request behavior but are marked unconfirmed against the backend currently being changed. Unconfirmed resource adapters deliberately report that they are not implemented.

Role cookies in either mode are navigation aids only. The FastAPI backend must enforce real authentication and authorization. Demo mode never asks for or stores a PIN, password, or token.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. The demo login works without backend credentials.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Routes

- `/login` is the shared login screen.
- `/app` is the farmer portal.
- `/expert` is the expert portal.
- `/admin` is the admin portal.
- Old `/farmer/*` and `/officer/*` links redirect to the new portal prefixes.

## Farmer profile and map tiles

The farmer profile stores demo form data in browser local storage only. County display is an approximate nearest-centre estimate; the backend must resolve county from saved coordinates. The map uses OpenStreetMap tiles. OSM's public tile server is for light use only; production deployments need a tile provider or self-hosted tiles.

## Status

This is a mock-first Phase 2 implementation, not production-ready. Profile writes and farm conditions are not implemented in API mode; current legacy API calls and contract gaps are tracked in [docs/missing-endpoints.md](./docs/missing-endpoints.md).
