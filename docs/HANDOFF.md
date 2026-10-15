# Agritech AI handoff

## Phase status

| Phase | Status |
|---|---|
| 1. Foundation, routing, services, demo auth | Done |
| 2. Farmer profile and Kenya location picker | Done |
| 3. Expert request lifecycle | Done |
| 4. Recommendations and business module | Done |
| 5. Market prices | Done |
| 6. Outbreak monitor | Done |
| 7. Polish, PWA, accessibility and Playwright | Not started |

## Run and review

- Install dependencies with `npm install`.
- Commands: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Data mode defaults to mock. Set `NEXT_PUBLIC_DATA_MODE=mock` for demo data or `api` to use only confirmed/legacy adapter calls. `NEXT_PUBLIC_API_BASE_URL` configures the API base URL; never put secrets in frontend env vars.
- Open `/login` and choose a demo Farmer, Expert, or Admin persona. Mock credentials are not collected. The Demo controls panel changes persona and success/empty/error scenario.
- Mock screens and fixtures are demonstrations, not live data or agronomic advice.

## Architecture map

- `src/app/`: Next.js App Router. Route groups `(farmer)`, `(expert)`, and `(admin)` provide `/app`, `/expert`, and `/admin`.
- `src/components/portal-shell.tsx`: shared portal shells, role navigation, demo availability and planned-phase labels. Update `supportedDemoScreens` and each nav item's phase when a screen is implemented.
- `src/features/`: retained legacy feature code.
- `src/services/`: resource interfaces, selectors, and `adapters/mock.ts` / `adapters/api.ts`; market price mock/API adapters live in `src/services/market-prices.ts`.
- `src/mocks/`: deterministic demo fixtures and scenario resolution.
- `src/types/`: domain models; mark unconfirmed frontend fields as proposed.
- `src/lib/`: pure business logic and `*.spec.ts` tests; HTTP/data-mode, location, profile, and demo request helpers.
- `src/i18n/messages/{en,sw}.ts`: English and Kiswahili user-facing copy; Kiswahili agronomy copy needs expert review.
- `src/components/portal-state.tsx`: loading, empty, error/retry, and success states.
- `src/components/farm-profile-map.tsx`: Leaflet client map. Use dynamic import with `ssr: false` for map components.
- `src/middleware.ts`: role/navigation redirects and guards, including `/farmer/*` → `/app/*` and `/officer/*` → `/expert/*`; not a security boundary.
- `src/lib/http.ts`: low-level mock-mode HTTP guard; do not bypass it.
- `npm test` runs Vitest and the existing Node test runner.

### Adding a resource

1. Confirm scope and contract against the product spec; record unconfirmed fields/endpoints in `docs/missing-endpoints.md`.
2. Add typed domain fields in `src/types/` and a service interface in `src/services/contracts.ts`.
3. Add deterministic fixtures only in `src/mocks/`; honor success, empty, and error scenarios.
4. Implement a mock adapter and an API stub. Only implement live calls after the backend contract is confirmed.
5. Export and select the resource in `src/services/index.ts`; screens consume only the interface.
6. Put UI copy in both locale resources, add loading/empty/error states, accessibility, and update portal navigation/support.
7. Add focused pure logic tests and validate typecheck, lint, tests, and build.

## Browser storage and cookies

- localStorage: `agritech_theme` (theme preference), `agritech_demo_farmer_profile_v1` (demo profile), `agritech_demo_expert_requests_v1` (shared demo lifecycle), `agritech_demo_expert_id_v1` (acting demo expert), `agritech_demo_vendor_events_v1` (demo vendor metrics), `agritech_demo_selected_market` (demo market preference), `agritech_demo_outbreak_alerts_v1` (simulated outbreak alerts and thresholds).
- Cookies: `agritech_locale` (language), `demo_role` (demo persona only), `demo_scenario` (success/empty/error), `farmer_role`, `staff_role`, `portal_role` (navigation/session aids; backend authorization remains authoritative).
- Staff browser storage: `agritech_staff_access`, `agritech_staff_role` in API mode.
- Demo persona cookies contain a role only, never credentials or tokens. Browser role cookies are not authorization.

## Gotchas

- `react-leaflet` v5 is required for React 19; Leaflet is client-only. The default marker asset is bundler-sensitive; use the existing `divIcon` pattern.
- Keep `supportedDemoScreens` and navigation phase values in `portal-shell.tsx` synchronized with the implemented demo routes.
- The mock request flow uses the known demo farmer id `demo-farmer-1`.
- `src/lib/http.ts` must prevent all backend requests in mock mode.
- Preserve both Vitest and Node test runners in `npm test`.
- County lookup is approximate; the backend must resolve county from coordinates.
- Public OpenStreetMap tiles are for light use only; production needs a tile provider or self-hosted tiles.

## Phase log

### Phase 1 — foundation

- Added portal shells, route groups, navigation guards, login personas, and legacy route redirects.
- Added typed resource services, mock/API adapter selection, mock fixtures, and the mock HTTP guard.
- Added light/dark tokens, English/Kiswahili resources, state components, and demo controls.
- Validation: lint, typecheck, tests, and build passed.

### Phase 2 — farmer profile

- Added the farmer profile form, persisted demo profile, Kenya-bounds picker, coordinate inputs, and approximate county label.
- Added farm conditions dashboard summary and a lazy-loaded health chart.
- Added pure tests for location, county estimation, summary copy, and profile validation.
- Validation: lint, typecheck, tests, and build passed.

### Phase 3 — expert request lifecycle

- Added shared demo request store and deterministic lifecycle transitions across farmer, expert, and admin screens.
- Added scoring, expiry/reoffer, role-based phone projections, admin controls, feedback, and demo time/persona controls.
- Preserved legacy API flows; new lifecycle API capabilities remain stubs pending contract confirmation.
- Validation: lint, typecheck, tests, and build passed.

### Phase 4 — recommendations and business module

- Added proposed localized crop/breed, vendor, vendor-product and vendor-portal types; the vendor-portal service remains interface-only.
- Added deterministic sample catalogues for six crop varieties, five livestock breeds, eight vendors and four approximate agro-zones.
- Added mock-only recommendation/vendor services, zone fit ranking, reason keys, vendor filters/distance ordering and local view/contact counts; API adapters remain not implemented.
- Added farmer crop/livestock cards, agrovet directory and profile, client-only Kenya-bounds vendor map, indicative prices, contact tracking and English/Kiswahili copy.
- Added pure tests for ranking/reasons, zone selection, alternatives, distance/filtering, UTC+3 hours and WhatsApp formatting.
- Validation: `npm run typecheck`, `npm run lint`, `npm test` (29 Vitest + 15 Node tests), and `npm run build` passed.

### Phase 5 — market prices

- Added approximate sample market coordinates across multiple Kenyan regions and deterministic eight-week histories for profile crop keys.
- Added nearest-market ordering, radius-limited best-market comparison, four-week trend calculation, and a farmer market-price screen with localized KES values.
- Added saved market selection, lazy Recharts line chart with accessible table alternative, and per-crop missing-data handling. No API market-price helpers existed in `src/lib/api.ts`; the API adapter remains not implemented.
- Best-market comparison assumes the five nearest markets within 100 km and excludes transport costs, quality, fees, and travel time; confirm prices directly at market.
- Added Phase 5 pure tests for ordering/limits, radius, ties/no-data, trend thresholds, and deterministic history.
- Validation: typecheck, lint, tests (35 Vitest + 15 Node tests), and build passed.

### Phase 6 — outbreak monitor and farmer risk

- Added sample risk assessments for saved crops/livestock and nearby sent-alert visibility for farmers and experts; rules use current rainfall/NDVI trend fields only and require agronomist validation.
- Added deterministic signal aggregation, threshold filters, recipient previews, admin alert history, and local simulated send. No SMS is sent; alerts, thresholds, and recipient counts are demo-only browser data.
- The map uses graduated report-cluster circles rather than a statistical heatmap; coordinates and farmer locations are approximate sample data. Nearby alerts use a farm pin and alert radius.
- Risk content is illustrative, not advice. Kiswahili copy needs native-speaker and agronomist review. Backend must own validated rules, filtering, recipient selection, sending and delivery state.
- Map root cause: the Content-Security-Policy `img-src` omitted OpenStreetMap tile hosts. Added the tile host allowlist, imported Leaflet CSS once in the root layout, and added resize invalidation plus localized tile-error fallbacks for all maps.
- Hidden or removed in Phase 6 audit: none; Phase 6-built screens and interactions are within the approved scope.
- Added pure tests for UTC week boundaries, signal aggregation/filtering, alert coverage, unique recipient counts, and sample risk severity/reasons.
- Validation: `npm run typecheck`, `npm run lint`, `npm test` (41 Vitest + 15 Node tests), and `npm run build` passed.

## Backlog and next steps

- Next: Phase 7 polish, PWA, accessibility and Playwright.
- Backlog: admin market-prices console (scrape trigger and market management), deferred from Phase 5.
- Backlog: validated agronomic risk rules; outbreak SMS gateway/delivery status and recipient/read-state APIs; expert coverage editor and expert performance page; Playwright and PWA work in Phase 7.
- Deferred from Phase 3: expert coverage editor and expert performance page.
- Kiswahili translations need native-speaker review; agronomy copy also needs expert review.
- Review existing npm audit advisories separately; do not change dependencies without need.
- Phase 7: Playwright coverage, PWA/service worker, offline behavior, and full accessibility audit.
