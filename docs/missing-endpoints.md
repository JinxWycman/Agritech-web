# Backend contract gaps and legacy calls

This register distinguishes contract details stated by the product specification from frontend models or behaviors that still need confirmation. `NEXT_PUBLIC_DATA_MODE=mock` uses deterministic fixtures. API adapters for unconfirmed capabilities throw a clear not-implemented error.

## Existing endpoint calls moved behind API adapters

These are inherited calls and payloads, not confirmation that they still match the backend under active change. They preserve the prior frontend behavior.

| Resource / screen | Legacy call retained by adapter | Contract status |
|---|---|---|
| Farmer login | `POST /auth/login` with `{ phone_number, pin }` | Legacy, unconfirmed against the backend currently being changed. Spec lists `POST /auth`; path and payload need confirmation. |
| Farmer dashboard summary and profile baseline | `GET /auth/me` | Legacy, unconfirmed against the backend currently being changed. |
| Staff login and session | `POST /staff/login`, `POST /staff/refresh`, `POST /staff/logout` | Legacy, unconfirmed against the backend currently being changed. |
| Staff identity (legacy shell/session bootstrap) | `GET /staff/me` | Legacy, unconfirmed against the backend currently being changed. |
| Admin overview | `GET /admin/overview` | Legacy, unconfirmed against the backend currently being changed. |
| Expert queue summary | `GET /admin/expert-requests?status=Pending|Accepted|Completed&limit=6&offset=0` | Legacy, unconfirmed against the backend currently being changed. |
| Farmer expert lookup | `GET /experts?is_available=true&limit=50&offset=0` | Moved behind the typed API adapter; legacy filters and mapping are unconfirmed against the backend currently being changed. |
| Farmer expert request (legacy request page) | `POST /expert-request` | Legacy, unconfirmed. The spec lists `/expert-requests` (plural) and the request lifecycle is not yet confirmed. |

## Confirmed by the specification

The following are capability/contract statements from the spec, not an assertion that current backend response schemas have been verified:

- Existing resource endpoint groups: farmer records, farmer crop/livestock records, experts, expert requests, market prices, advisories, products, notifications, pricing, staff auth, and admin resources. Refer to the source specification in `docs/agritech-website-prompt.md`.
- Required product roles and route prefixes: farmer `/app`, expert `/expert`, admin `/admin`.
- Expert request visible lifecycle labels: Pending, Offered, Accepted, Completed; admin additionally needs Unassigned and Escalated.
- The website must display an expert phone number to the farmer only after the request is Accepted.

## Proposed frontend fields awaiting backend confirmation

All fields below are proposed UI model fields unless specifically marked as confirmed. They must not be sent to a live API until its resource contract is confirmed.

| Capability | Screen | Proposed shape / fields | Status |
|---|---|---|---|
| Farmer extended location | Farmer onboarding and profile | `latitude`, `longitude`, `sub_county`, `ward`; current backend is described by the spec as storing county only | Proposed; missing |
| Farmer profile write | Farmer profile form | `farm_size_acres`, crop identifiers/names, livestock identifiers/names, sub-county, ward, latitude, longitude, and a profile-completion rule | Proposed; write adapter not implemented. The frontend currently has no confirmed live helpers for farmers, farmer-crops, or farmer-livestocks. |
| County resolution | Farmer profile and dashboard | Resolve a county from the saved farm coordinates | Proposed; frontend nearest-centre county is approximate only and must not replace backend resolution. |
| Farm and crop suitability | Farmer dashboard and recommendation cards | Crop variety / livestock breed identity, suitability attributes (altitude, rainfall), maturity, risks | Proposed; missing catalogue |
| Structured recommendations | Farmer crop/livestock recommendations | Suggested variety or breed, fit reasons, maturity, risks, ranked alternatives, sourcing, matched products, confidence note | Proposed; missing endpoint |
| Vendor directory | Farmer directory, admin products/vendors, future vendor portal | Vendor name, location, county, contact, hours, rating | Proposed; missing |
| Vendor product offers | Recommendation sourcing and vendor pages | Product/vendor relationship, indicative price, unit, stock status | Proposed; missing |
| Market coordinates and distance query | Farmer market prices and admin market management | Market identifier, coordinates, nearest-market query using farm location | Proposed; missing |
| Expert offer lifecycle | Farmer and expert request screens; admin assignment board | Offer/request/expert identifiers, offered time, response time, response; Unassigned and Escalated status support | Proposed; missing |
| Expert request detail | Ask-an-expert flow | Symptom code, urgency, `channel` (`ussd`, `sms`, `web`), reference code | Proposed; missing |
| Outbreak signals and alerts | Farmer alerts and admin outbreak monitor | Aggregated counts by area, symptom, species/crop, and week; alert create/list | Proposed; missing |
| Farm conditions | Farmer dashboard and expert case brief | Current weather, forecast, NDVI, normal NDVI, rainfall and normal rainfall snapshot for coordinate | Proposed; missing |
| Farmer open-request count | Farmer dashboard | Count of open expert requests for the authenticated farmer | Proposed; missing |
| Farmer unread-alert count | Farmer dashboard | Count of unread alerts for the authenticated farmer | Proposed; missing |
| Domain entity metadata | All portals | Vendor, product, farm, recommendation, expert request, notification and admin summary shapes used by `src/types/domain.ts` | Proposed frontend models; confirm per resource |

## Decisions to confirm

- The backend staff role currently named `officer` is presented as frontend role `expert`; `platform_admin` is presented as `admin`. This mapping is in the API auth adapter only. Confirm role names and permissions.
- Confirm farmer and staff auth paths, request/response payloads, cookie/token lifecycle, refresh semantics, and logout behavior. The specification says `POST /auth`, while the inherited UI called `POST /auth/login`.
- Confirm each existing endpoint response shape against the backend's current OpenAPI document before expanding API adapter coverage.
- Confirm expert queue access rules and whether the current admin endpoint is the intended source for expert queue records.
- Confirm whether locale preference should remain cookie-only or also be part of a persisted profile setting.
- Confirm the farmer profile read/write contracts, whether crops and livestock are separate `farmer-crops` / `farmer-livestocks` resources, and how `profile_complete` is determined.
- Confirm the farm-conditions, open-request-count, and unread-alert endpoints and response shapes before implementing API adapters.
- Confirm the coordinate-to-county resolver and whether the backend returns county names, identifiers, or both.

## Expert request workflow gaps

The following capabilities are requested by the product specification; payload names, status transitions, and response shapes still require backend confirmation. The new browser lifecycle is demo-only and persists in namespaced local storage.

| Capability | Screen | Proposed shape / fields | Status |
|---|---|---|---|
| Expert offers and lifecycle | Farmer request tracker, expert queue/cases, admin board | Request/expert IDs, offered-at and expiry, responded-at, decline reason, accepted/completed/escalated/cancelled transitions | Proposed; existing API-mode calls remain on legacy UI pending confirmed contract. |
| Symptom codes | Farmer ask-an-expert form | Catalogue of symptom code, issue type, localized label | Proposed; mock catalogue only. |
| Request channel | Farmer ask-an-expert form | `channel` value `web` (with `ussd` and `sms` supported by the product specification) | Product channels confirmed; API payload field awaits confirmation. |
| Reference code | Farmer request receipt and status tracking | Stable human-readable reference code and uniqueness scope | Proposed; deterministic demo sequence only. |
| Assignment scoring | Admin request board | Workload, time since last assignment, response rate, proximity; score weights and per-candidate score breakdown | Proposed; expert scoring inputs and settings API await confirmation. |
| Offer timeouts | Admin settings and offer expiry | Per-urgency timeout values and expiry timestamp | Proposed; mock settings only. |
| Farmer feedback | Completed request detail | `solved` boolean linked to request and farmer | Proposed; no confirmed endpoint. |
| Expert availability | Expert availability screen | Availability boolean per authenticated expert | Legacy API mode retains `PATCH /admin/me/availability`; contract unconfirmed. |
| Expert phone visibility | Farmer request detail | Reveal assigned expert phone only after Accepted; completed is also visible | Privacy rule confirmed by specification; field contract is unconfirmed. |
| Farmer phone visibility | Expert offer/case brief | Hide farmer phone on offer, reveal only after the expert accepts | Proposed privacy enforcement in mock service; backend must enforce equivalent authorization. |
