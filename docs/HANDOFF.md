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
| 6b. Farmer and expert screens | Done |
| 6c. Legacy admin mock services | Deferred by owner |
| 7a. Translation, PWA and offline polish | Done |
| 7b. Production safety, browser tests and accessibility | Done (full-suite rerun pending) |

## Run and review

- Install dependencies with `npm install`.
- Commands: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Data mode defaults to mock. Set `NEXT_PUBLIC_DATA_MODE=mock` for demo data or `api` to use confirmed/legacy adapter calls. Set server-only `API_URL` to the backend origin; the browser calls the same-origin `/backend` proxy, so the backend URL is not exposed to JavaScript.
- Open `/login` and choose a demo Farmer, Expert, or Admin persona. Mock credentials are not collected. The Demo controls panel changes persona and success/empty/error scenario.
- Mock screens and fixtures are demonstrations, not live data or agronomic advice.

## Architecture map

- `src/app/`: Next.js App Router. Route groups `(farmer)`, `(expert)`, and `(admin)` provide `/app`, `/expert`, and `/admin`.
- `src/components/portal-shell.tsx`: shared portal shells, role navigation, demo availability and planned-phase labels. Planned tags derive from built-route membership; update route support when screens are implemented.
- Phase 6b screens/services: `src/components/account-screens.tsx`; resource services `notifications.ts`, `subscription.ts`, `notification-preferences.ts`, `expert-performance.ts`, `expert-coverage.ts`; metrics/validation in `src/lib/expert-performance.ts` and `src/lib/account-validation.ts`.
- `src/features/farmers/components/` and `src/features/experts/components/`: role-specific portal UI. Route pages import from each feature's component barrel.
- `src/features/legacy-farmer-login/`: retained legacy feature code.
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

- localStorage: `agritech_theme` (theme preference), `agritech_demo_farmer_profile_v1` (demo profile), `agritech_demo_expert_requests_v1` (shared demo lifecycle), `agritech_demo_expert_id_v1` (acting demo expert), `agritech_demo_vendor_events_v1` (demo vendor metrics), `agritech_demo_selected_market` (demo market preference), `agritech_demo_outbreak_alerts_v1` (simulated outbreak alerts and thresholds), `agritech_demo_notifications_read_v1` (demo read IDs), `agritech_demo_subscription_v1` (demo payment history; last four phone digits only), `agritech_demo_notification_prefs_v1` (device-local demo preferences). PWA caches only public shell assets and eligible public navigations; it does not cache personal/private pages, API/backend responses, non-GET requests, or map tiles.
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

## Screen coverage matrix

Statuses: **built** = mock-first and works in demo mode; **legacy** = older backend-connected screen blocked in mock mode; **placeholder** = generic planned screen; **deferred** = no screen yet, with reason.

| Portal | Route / capability | Status | Notes |
|---|---|---|---|
| Farmer | `/app` and `/app/overview` | built | Demo dashboard and profile/alert counts. |
| Farmer | `/app/profile` | built | Profile and farm pin. |
| Farmer | `/app/recommendations` | built | Crop recommendation cards. |
| Farmer | `/app/livestock` | built | Breed recommendation cards; missing farm pin intentionally links to profile. |
| Farmer | `/app/risks` | built | Sample risk and nearby outbreak alerts. |
| Farmer | `/app/market-prices` | built | Nearest-market comparison and trends. |
| Farmer | `/app/requests`, `/app/requests/new`, `/app/requests/[id]` | built | Shared demo request lifecycle. |
| Farmer | `/app/agrovets`, `/app/agrovets/[id]` | built | Vendor directory and profile. |
| Farmer | `/app/notifications` | built | Demo lifecycle/outbreak/system notifications; persistent read state. |
| Farmer | `/app/subscription` | built | Sample quote and simulated M-Pesa payment; no money charged. |
| Farmer | `/app/settings` | built | Language and local notification preferences; API-only PIN form validates but does not submit until contract confirmation. |
| Expert | `/expert` and `/expert/overview` | built | Demo queue. |
| Expert | `/expert/requests` | built | Request offers/cases and case brief. |
| Expert | `/expert/availability` | built | Availability plus demo county coverage editor; coverage does not affect assignment. |
| Expert | `/expert/performance` | built | Demo request aggregates and feedback. |
| Admin | `/admin` and `/admin/overview` | built | Demo operations summary. |
| Admin | `/admin/requests` | built | Shared demo request lifecycle and assignment controls. |
| Admin | `/admin/outbreaks` | built | Demo signal clusters and simulated alerts. |
| Admin | `/admin/farmers`, `/admin/farmers/[id]` | legacy | Existing API-connected farmer table/detail; unavailable in demo mode. |
| Admin | `/admin/experts` (experts and staff) | legacy | Existing API-connected directory/staff actions; unavailable in demo mode. |
| Admin | `/admin/market-prices` | legacy | Existing API-connected list and scrape control; market directory management deferred. |
| Admin | `/admin/advisories` | legacy | Existing API-connected console; unavailable in demo mode. |
| Admin | `/admin/products` | legacy | Existing API-connected product catalogue; vendor management is not included. |
| Admin | `/admin/pricing`, `/admin/subscriptions`, `/admin/quotes`, `/admin/sms-sessions`, `/admin/audit` | legacy | Existing admin pages retained; verify their API dependencies before demo use. |
| Admin | `/admin/staff`, `/admin/field-officers` | placeholder | No dedicated route; the existing experts page partially combines staff management. |
| Admin | Market directory management | deferred | Admin markets CRUD is not implemented. |
| Vendor | Vendor portal | deferred | Types/service interface only; no vendor portal UI or route. |

## Phase log

### Live API wiring follow-up — 2026-10-17

- Added farmer registration using `GET /counties`, `POST /farmers/register`, then `POST /auth/login`; it uses the backend's required `full_name`, `national_id`, `phone_number`, `pin`, and `county_id` fields.
- Connected recommendation pages to `GET /recommendations/` and the explicit generate action to `POST /recommendations/generate` with `{ kind, answers }`. The backend saves the recommendation and attempts SMS submission; the screen reports the provider result and saved delivery states.
- Corrected the expert queue adapter to use `GET /admin/expert-requests?status=...&limit=6&offset=0`, consume the backend's paginated response, and preserve officer assignment scoping.
- Typecheck passed. Other service stubs remain; see the live API wiring note in `docs/missing-endpoints.md`.

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

### Phase 7a — translation, locale formatting, PWA and offline

- Added nested English/Kiswahili message parity and interpolation tests plus locale-aware KES, date, date-time, and number helpers. Kiswahili review notice remains in place.
- Added installable manifest, original SVG sprout icon, production-only service-worker registration, localized offline page/banner, and cache policy tests. No logo or `sharp` package was available, so raster 192/512 and maskable PNG icons remain needed.
- Cache rules: cache-first for `/_next/static/*` and `/icons/*`; network-first for navigations; only successful public GET navigations without `private`/`no-store` may be cached. Never cache `/backend/*`, `/api/*`, non-GET requests, or OpenStreetMap tiles. `public/sw.js` duplicates the tested rule in `src/lib/pwa.ts`.
- Dependency audit: initial production audit reported 3 advisories (PostCSS and source-map-js); `npm audit fix` patched source-map-js. PostCSS requires a Next major upgrade and was not forced. The post-fix full audit reported 14 advisories including dev tooling (Vitest/tinypool and Tailwind toolchain); do not force major upgrades.
- Subscription polling now stops unless the latest payment is pending or prompt-sent.
- Build bundle review (First Load JS): `/app/profile` 185 kB, `/expert/availability` 184 kB, `/expert/requests` 181 kB. Map and chart implementations are behind existing dynamic client loaders; the build showed no reason to change them.
- Validation: lint passed; 54 Vitest + 15 Node tests passed; production build passed including integrated type validation. The final standalone `npm run typecheck` attempt occurred before the two manifest/chart fixes and failed; no fourth standalone run was made under the three-run limit.
- Remaining hardcoded English is limited to existing API/legacy surfaces such as `request-board.tsx` and the unused legacy `shell.tsx`; language names in the locale picker are intentional.

### Phase 7b — production safety, browser tests and accessibility

- Production fails closed unless `NEXT_PUBLIC_DATA_MODE` is valid; API mode also requires an API base URL. Demo picker, controls, scenarios, indicator, and cookie are limited to allowed mock mode. API errors do not fall back to mock fixtures.
- API-mode login retains the existing farmer `POST /auth/login` and staff `POST /staff/login` paths; both are recorded as unconfirmed in section A of `docs/missing-endpoints.md`. The proxy reads the server-only `API_URL` setting.
- API-connected portal routes are `/admin/farmers/:id`, `/admin/experts`, `/admin/market-prices`, `/admin/advisories`, `/admin/products`, `/admin/subscriptions`, `/admin/pricing`, `/admin/quotes`, `/admin/sms-sessions`, `/admin/audit`, `/admin/overview`, `/admin/requests`, `/expert/overview`, `/expert/requests`, `/expert/availability`, `/app/overview`, `/app/profile`, `/app/recommendations`, and `/app/livestock`. Other API-mode portal routes show a localized not-connected page.
- Playwright inventory: farmer request/expert acceptance lifecycle; map/CSP regression; admin outbreak alert; locale persistence; demo error/empty states; route guards; manifest/service-worker/offline behavior; skip-link keyboard flow; and axe scans. Run `npm run test:e2e`; the production server uses port 3100 and `.next-e2e`. Desktop runs the suite; mobile (360×740) runs farmer lifecycle and accessibility.
- Axe scanned all requested farmer, expert, admin, and login routes with WCAG 2.0/2.1 A/AA tags, excluding `.leaflet-container`. Desktop and mobile scans passed with 0 critical, 0 serious, 0 moderate, and 0 minor findings after the dark-theme contrast corrections.
- E2E verification note: the initial full run exposed dark-theme contrast violations. The desktop and mobile accessibility specs were rerun and passed after fixes; the complete suite was not rerun after those fixes. No `test.fixme` cases are recorded.
- Final checks: `npm run typecheck` and `npm run lint` passed; `npm test` passed (57 Vitest and 15 Node tests). Production builds started by the E2E web server completed successfully. Full E2E remains unverified after the contrast fixes.

## Production configuration

- Production API deployment requires `NEXT_PUBLIC_DATA_MODE=api` and server-only `API_URL`. The Next.js backend proxy reads only `API_URL`; do not publish the backend origin through a `NEXT_PUBLIC_*` variable. The proxy keeps browser requests same-origin, so browser CORS configuration is not needed for this app.
- The app fails closed with a localized configuration message when the production data mode is unset/invalid, or when API mode has no upstream URL. Mock mode is allowed in production only with `NEXT_PUBLIC_DEMO_ENABLED=true`; use `NEXT_PUBLIC_DATA_MODE=mock NEXT_PUBLIC_DEMO_ENABLED=true` for an explicitly public demo deployment.
- Demo controls and demo persona/cookie behavior are available only in allowed mock mode. API mode ignores demo identity and shows the not-connected page for routes outside the API-connected list above.
- Live integration remains blocked on the unconfirmed resource contracts in section F of `docs/missing-endpoints.md`; see section A there for login paths that still need confirmation.

## Release status

**Frontend-ready, deployment/integration blocked**

- Verified: the production safety guards, proxy configuration check, login-mode behavior, and connected-route boundary are implemented; desktop and mobile accessibility scans passed with zero reported violations; the two targeted post-fix axe runs passed.
- Not verified as a full release: the complete Playwright suite was not rerun after fixing the initial contrast findings. Confirm full E2E status before deployment.
- Backend-owner actions: confirm the farmer and staff login contracts and the resource contracts listed in section F of `docs/missing-endpoints.md`; provide a reachable production API URL and validate the proxy/upstream setup.
- Other blockers: raster 192/512 and maskable PNG icons are still needed; production requires a real tile provider or self-hosted tiles; Kiswahili needs native-speaker review; sample catalogue and risk rules need agronomist review; `npm audit` has remaining advisories (including PostCSS requiring a major Next upgrade and dev-only toolchain advisories; no forced major upgrades were made).

## Release checklist

- [x] Production fails closed when required configuration is missing; explicit demo deployment is gated.
- [x] Demo features are unavailable in API mode; API-mode unconnected routes are clearly identified.
- [x] Desktop and mobile axe scans pass; no serious or critical findings.
- [ ] Rerun the complete Playwright suite after the contrast fixes and confirm all critical flows.
- [ ] Confirm API and authentication contracts with the backend owner and validate a deployment.
- [ ] Add raster PWA icons and configure a production tile provider.
- [ ] Complete native Kiswahili and agronomist reviews; review remaining npm advisories.

## Backlog and next steps

- Phase 6c is deferred by the owner: legacy admin pages still work in api mode; mock versions are parked in the backlog.
- Next: live backend integration is a separate later phase; Phase 7b is complete.
- Backlog: Phase 6c mock admin screens; vendor portal UI; admin markets CRUD; a real heatmap; remaining live backend integration per section F of `docs/missing-endpoints.md`; server-backed notifications, payment, preferences/PIN, expert performance/coverage, outbreak SMS delivery, recipients, and read-state contracts.
- Backlog: rerun the full Playwright suite after the contrast fixes. There are currently no `test.fixme` items.

- Kiswahili translations need native-speaker review; agronomy copy also needs expert review.
- Review existing npm audit advisories separately; do not change dependencies without need.
