# Backend contract register

The specification confirms product capabilities and selected business rules, not the backend's current request or response schemas. TypeScript fields described as proposed must be confirmed before implementing live adapters. Mock data is deterministic sample content and is not agronomic advice.

## A. Decisions before connecting

1. Authentication path: specification `POST /auth` or legacy `POST /auth/login`; confirm payload and response.
2. Token transport, storage boundary, refresh rotation, expiry, logout, and cookie flags.
3. Backend role names and permissions. Frontend maps `officer` to `expert` and `platform_admin` to `admin` in `src/services/adapters/api.ts`; confirm both source roles and mapping.
4. Same-origin proxy versus direct API/CORS; confirm deployment and `NEXT_PUBLIC_API_BASE_URL` expectations.
5. Standard error envelope, validation-error format, and retry/rate-limit semantics.
6. Pagination/filter/sort conventions and maximum page sizes.
7. Identifier formats and uniqueness scope; timestamp format/time zone; Kenyan phone format and normalization.
8. Language-neutral enum codes for lifecycle, urgency, symptoms, stock, and categories; localization belongs to the client.
9. Whether OpenAPI-generated TypeScript types are available and which document/version is authoritative.
10. Confirm county-name/identifier semantics, locale persistence, and all legacy endpoint payloads against the changing backend.

## B. Per-resource contract table

| Capability | Endpoint(s) | Key fields (frontend model) | Rules the backend must enforce | Screens | Status |
|---|---|---|---|---|---|
| Authentication and roles | `POST /auth` or legacy `/auth/login`; staff login/refresh/logout | `src/types/domain.ts` `DemoAuthResult`, `UserRole` | Authenticate credentials; authorize every resource; define token lifecycle and roles | `/login`, all portals | Capability and frontend roles confirmed; paths, payloads, token and role mapping are legacy/proposed |
| Farmer, crop and livestock records | Existing farmer, `farmer-crops`, and `farmer-livestocks` resource groups; exact paths TBD | `src/types/domain.ts` `Farmer`, `Crop`, `Livestock` | Scope reads/writes to the authenticated farmer and validate entity ownership | Farmer profile, recommendations | Resource groups are named by the spec; paths and response fields are proposed/unconfirmed |
| Farmer profile and farm location | Existing farmer/profile resources; profile write/location endpoint TBD | `src/types/domain.ts` `FarmerProfile`; `src/types/business.ts` `Coordinates` usage | Bind to authenticated farmer; validate coordinates; resolve authoritative county from coordinates; define completion rules | `/app/profile`, `/app/overview` | Profile concepts confirmed; location/write fields proposed; write adapter not implemented |
| Farm conditions | Endpoint TBD | `src/types/domain.ts` `FarmConditionsSnapshot` | Return location/time-bounded weather, rainfall normal and NDVI with units and provenance | Farmer dashboard, expert case brief, recommendations | Proposed fields; no confirmed endpoint |
| Farmer dashboard counts | Open expert request and unread alert count endpoints TBD | `src/types/domain.ts` farmer count service interfaces | Scope counts to authenticated farmer and current statuses/read state | `/app/overview` | Proposed; mock counts only |
| Expert request lifecycle | Existing `POST/PATCH /expert-requests` or legacy `/expert-request`; offers and detail endpoints TBD | `src/lib/request-lifecycle.ts` `ExpertRequestRecord`; `src/services/contracts.ts` lifecycle service | Enforce valid transitions, actor permissions, server-side offer expiry/re-offer, unique reference codes, notifications and audit | `/app/requests`, `/expert/requests`, `/admin/requests` | Lifecycle labels Pending/Offered/Accepted/Completed are spec-confirmed; API state machine and fields proposed. Legacy calls are listed in E |
| Experts and availability | Existing `GET /experts`; availability endpoint TBD | `src/types/domain.ts` `Expert`; `src/types/business.ts` expert-independent location | Enforce staff identity and availability permissions; return only necessary PII | Expert queue, admin assignment | Expert directory is legacy-existing, unconfirmed; scoring/location fields proposed |
| Symptoms | Catalogue endpoint TBD | `src/services/contracts.ts` `Symptom` | Stable language-neutral codes; return labels by locale or locale-neutral text keys; validate request codes | `/app/requests/new` | Proposed; deterministic demo catalogue only |
| Assignment settings and scoring | Admin read/write settings endpoint TBD | `src/lib/request-lifecycle.ts` `RequestSettings`, `ScoredExpert` | Validate non-negative weights, at least one positive weight, timeout policy, and perform authoritative server-side scoring | `/admin/requests` | Proposed; demo scoring and settings only |
| Crop variety catalogue | Catalogue endpoint TBD | `src/types/business.ts` `CropVariety`, `Suitability` | Return localized English/Kiswahili content, agronomist-validated suitability, maturity, risks, planting window, spacing and rotation/intercropping | `/app/recommendations` | Specific varieties and card fields confirmed; schema, ranges, and all sample values proposed |
| Livestock breed catalogue | Catalogue endpoint TBD | `src/types/business.ts` `LivestockBreed`, `Suitability` | Return localized validated suitability, maturity, risks, stocking, feed, housing and vaccination guidance | `/app/livestock` | Specific breeds and required detail categories confirmed; schema and sample values proposed |
| Structured recommendations | Endpoint TBD | `src/types/business.ts` `Recommendation`, `RecommendationReason` | Derive altitude, rainfall normals and soil from coordinates; document season/NDVI inputs, ranking, confidence and data provenance; return localized reasons and alternatives | `/app/recommendations`, `/app/livestock` | Card requirements confirmed; backend response shape proposed. Demo currently matches nearest approximate agro-zone |
| Vendors | Vendor directory/profile endpoints TBD | `src/types/business.ts` `Vendor`, `OpeningHours` | Validate locations/contact, certification source/status, rating provenance, and opening-hours time zone | `/app/agrovets`, `/app/agrovets/[id]` | Capability confirmed; model and endpoint proposed; missing |
| Vendor products, price and stock | Existing `/products` lacks vendor, price and stock; vendor-offers endpoint TBD | `src/types/business.ts` `VendorProduct` | Authorize vendor ownership; validate KES amount, unit, stock and update timestamps | Recommendations, vendor directory/profile | Product capability confirmed; vendor/price/stock relationship proposed; missing |
| Vendor view/contact events | Event endpoint TBD | `src/types/business.ts` `VendorPortalStats`; `src/services/contracts.ts` `VendorService` | Attribute events safely; protect personal data; define aggregation, deduplication and retention | Vendor pages; future vendor portal | Proposed; demo counts persist locally only |
| Vendor role and portal | Vendor auth/shop/product/event endpoints TBD | `src/types/business.ts` `VendorShopProfile`, `VendorProductUpdate`, `VendorPortalStats`; `src/services/contracts.ts` `VendorPortalService` | Isolate each vendor's shop and products; authorize all writes and stats | No vendor UI in Phase 4 | Fourth-role data model required by spec; endpoint and role details proposed; no adapter/UI |

The frontend domain types in `src/types/domain.ts` also contain proposed `Farm`, `Crop`, `Livestock`, `Farmer`, `MarketPrice`, `Notification`, `OutbreakSignal`, `AdminSummary`, and request summary fields. Confirm them against their resource contracts before live use.

## C. Demo-only rules the backend MUST enforce

- Farmer sees an assigned expert's phone only when the request is Accepted or Completed (spec-confirmed privacy rule).
- Expert sees farmer phone only after accepting; this is a frontend assumption to confirm, and must be enforced server-side if adopted.
- Offer expiry and re-offer run on the server, not browser timers or read-triggered demo logic.
- Assignment scoring and settings are computed/applied server-side; clients cannot choose or alter authoritative scores.
- Enforce request state machine, role/ownership permissions, unique reference-code generation, and safe reassignment.
- Create server-side notifications and audit entries for lifecycle changes and administrative actions.
- Resolve county authoritatively from coordinates. The demo's nearest-centre result is approximate only.
- Enforce vendor ownership, certification/rating integrity, and product price/stock write access.

## D. Needs for Phases 5–7

| Capability | Endpoint/data needed | Proposed fields | Status |
|---|---|---|---|
| Market directory (Phase 5) | Admin-managed market directory endpoint TBD | `src/types/market.ts` `Market`: id, localized name, county, latitude, longitude | Maintain authoritative market coordinates and county association; frontend demo coordinates are approximate | Farmer market-price screen; future admin market console | Market capability is in spec; exact endpoint and coordinates schema proposed |
| Nearest-markets query (Phase 5) | Server nearest-market query TBD; legacy prices are keyed by county and crop, with no market coordinates | `src/types/market.ts` `Market`; query by farm coordinates, crop and limit/radius | Resolve farm coordinates and return nearest eligible markets consistently; document distance metric | `/app/market-prices` | Proposed; current demo uses haversine distance locally |
| Per-market, per-crop price | Existing `/market-prices`, `/county/{id}`, and `/crop/{id}` path families are described by the spec; confirm exact endpoint and response | `src/types/market.ts` `MarketPrice`: market id, crop key, KES per-unit price, localized unit, observed timestamp | Validate crop/market, currency, unit and observation timestamp; identify source and sample/live status | `/app/market-prices` | Existing endpoint families are county/crop keyed and lack market coordinates; no corresponding helpers were found in `src/lib/api.ts`, so no live calls were wrapped |
| Market price history/trend | Per-market/per-crop history endpoint TBD | `src/types/market.ts` `MarketPrice[]`, `PriceTrend` | Return ordered, dated observations with units; document corrections and missing weeks | `/app/market-prices` | Proposed; demo derives eight weekly samples deterministically |
| Market scrape trigger | `POST /admin/market-prices/scrape` | Admin scrape job result/status shape TBD | Admin-only authorization, audit, deduplication/rate limiting and explicit job result | Future admin market-prices console | Endpoint is named by spec; response and behavior require confirmation; out of scope Phase 5 |
| Outbreak signals and aggregation (Phase 6) | `GET /admin/outbreak-signals` with symptom/issue/subject/week filters | `src/types/outbreak.ts` `SignalEvent`, `SignalCell`, `SignalFilters`; coordinates, symptom/issue, subject, week, aggregate counts | Backend validates coordinates/codes and performs aggregation; suppress signal clusters below the configured minimum count before exposing them; enforce authorized admin access | `/admin/outbreaks` | Proposed; demo aggregates deterministic sample and lifecycle request signals locally |
| Outbreak thresholds (Phase 6) | `GET/PATCH /admin/outbreak-thresholds` | `src/types/outbreak.ts` `OutbreakThresholds` | Validate policy bounds, authorization and audit changes | `/admin/outbreaks` | Proposed; demo persists threshold settings locally |
| Outbreak alerts (Phase 6) | `GET /admin/outbreak-alerts`; `POST /admin/outbreak-alerts` (draft/preview); `POST /admin/outbreak-alerts/{id}/send` | `src/types/outbreak.ts` `OutbreakAlert`, `AlertDraft`; localized message, coordinates, radius, symptom/issue/subject, status, creator and recipient count | Server-side recipient eligibility, role authorization, consent/opt-out, deduplication, audit, expiry and delivery status; SMS provider integration and failure handling | `/admin/outbreaks`, `/app/risks`, expert case brief | Proposed; demo preview/send is simulated only and sends no SMS |
| Nearby outbreak alerts and farmer read state (Phase 6/7) | `GET /outbreak-alerts/nearby?latitude=&longitude=`; alert read/unread endpoint TBD | `src/types/outbreak.ts` `OutbreakAlert`; radius, localized message, status and timestamps | Return only alerts authorized for the farmer; confirm expert phone visibility assumptions, consent and read-state behavior | `/app/risks`, expert case brief; future notifications | Proposed; current demo filters sent alerts by farm pin and radius, with no read state |
| Disease/pest risk assessment (Phase 6) | Risk assessment endpoint TBD, or documented frontend rules contract | `src/types/outbreak.ts` `RiskAssessment`; `FarmConditionsSnapshot` in `src/types/domain.ts` | Decide whether validated, versioned rules live in the backend or a reviewed shared rules package; agronomist/veterinary approval required; derive local conditions safely and distinguish unknown from low risk | `/app/risks` | Proposed; static demo SAMPLE rules use rainfall/NDVI trends only; validation and ownership decision required |
| Notifications (Phase 6/7) | Farmer/expert/admin notifications and unread-count endpoints | Localized message key/params, recipient, event reference, timestamp, read state | Capability in spec; schema/endpoints proposed |

## E. Legacy calls inside API adapters

These calls were retained to preserve existing behavior. They are not confirmed against the backend currently being changed.

| Resource/screen | Legacy call and behavior | Status |
|---|---|---|
| Farmer login | `POST /auth/login` with `{ phone_number, pin }` | Legacy-existing; spec lists `POST /auth`, path/payload unconfirmed |
| Farmer dashboard/profile baseline | `GET /auth/me` | Legacy-existing; response mapping unconfirmed |
| Staff login/session | `POST /staff/login`, `POST /staff/refresh`, `POST /staff/logout` | Legacy-existing; contract unconfirmed |
| Staff identity/session bootstrap | `GET /staff/me` | Legacy-existing; contract unconfirmed |
| Admin overview | `GET /admin/overview` | Legacy-existing; response mapping unconfirmed |
| Expert queue summary | `GET /admin/expert-requests?status=Pending|Accepted|Completed&limit=6&offset=0` | Legacy-existing; expert access and response unconfirmed |
| Expert lookup | `GET /experts?is_available=true&limit=50&offset=0` | Legacy-existing; filters/mapping unconfirmed |
| Legacy farmer request submission | `POST /expert-request` | Legacy-existing; spec names plural `/expert-requests`; contract unconfirmed |
| Legacy expert request board and availability | Existing `POST/PATCH /expert-requests` and `PATCH /admin/me/availability` behavior retained by the legacy API UI | Legacy-existing; lifecycle contract unconfirmed |
| Products | Existing `/products` CRUD/list resource | Legacy-existing; does not provide vendor, indicative price or stock |
| Market prices | The spec describes `/market-prices` endpoint families keyed by `/county/{id}` and `/crop/{id}`; no matching helpers exist in `src/lib/api.ts` | No helper could be wrapped unchanged; Phase 5 API adapter remains an explicit not-implemented stub pending a confirmed contract |

Phase 4 recommendation, vendor directory/profile, product-offer and vendor-event API adapters are explicit not-implemented stubs. No new HTTP calls were added.

## F. Checklist for switching a resource to API mode

1. Confirm the resource endpoint, schema, authorization, enums, errors, pagination, IDs, timestamps and locale behavior with the backend owner/OpenAPI.
2. Mark each field as spec-confirmed, legacy-existing, or proposed; update this register before coding.
3. Add or verify typed request/response mapping in the API adapter; do not leak backend naming into UI/domain concepts.
4. Keep all screens on service interfaces and leave mock fixtures/scenarios unchanged.
5. Ensure the low-level HTTP guard still blocks every request in mock mode; add a focused test for new transport paths.
6. Add API adapter contract tests for mapping, errors and authorization-sensitive projections.
7. Verify mock success/empty/error, API behavior, typecheck, lint, tests and build before enabling that resource.
