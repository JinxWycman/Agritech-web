# Prompt: Agritech AI Website (Farmer, Expert and Admin portals)

## 1. Your role and goal

You are a senior frontend engineer and product designer. Build a professional, user-friendly web application for **Agritech AI**, a platform that helps Kenyan smallholder farmers. The platform already has a working FastAPI backend that serves farmers through USSD and SMS. The website is a second channel on the **same backend and database**, so every feature available on USSD/SMS must exist on the web, plus richer features that a phone menu cannot do (maps, charts, product catalogues).

The problems the product solves:

1. Farmers do not know which crop variety or livestock breed suits their land and weather, or where to buy it.
2. Farmers cannot reach vets or agriculture officers quickly, and officers are overloaded and badly matched to cases.
3. Disease and pest outbreaks are noticed late.
4. Farmers do not know which nearby market pays best.
5. Agrovets and input suppliers have no easy way to reach farmers who need them.

Design for a first-time smartphone user on a slow mobile connection. Plain language, big tap targets and clear next steps matter more than visual flourish.

## 2. Tech and design requirements

- React + TypeScript + Vite. Tailwind CSS with shadcn/ui components. TanStack Query for server state, React Router for routes, react-hook-form + zod for forms, Recharts for charts.
- **Maps: Leaflet via react-leaflet with OpenStreetMap tiles** (no Google Maps key). Restrict the map to Kenya (approximate bounds: latitude -4.7 to 5.1, longitude 33.9 to 41.9). Note in the README that OSM's public tile server is for light use and production should use a tile provider or self-hosted tiles.
- Mobile-first and responsive. Installable PWA with cached shell and graceful offline states. Keep initial JS small and lazy-load map and chart code.
- Languages: English and Kiswahili, with a language switcher and all copy in translation files.
- Accessibility: WCAG AA contrast, keyboard navigation, visible focus, labels on every input, and icons never used without text.
- Visual style: clean and trustworthy, a green primary palette with warm neutral backgrounds, generous spacing, one typeface, and consistent cards. Light and dark themes through design tokens.
- Every screen needs loading skeletons, empty states with a helpful action, and plain-language error messages with retry.
- Never put secrets in the frontend. Read the API base URL from an environment variable.

## 3. Roles, authentication and routing

Three portals behind one login screen, routed by role:

| Role | Route prefix | Auth |
|---|---|---|
| Farmer | `/app` | Phone number + PIN (`POST /auth`, `GET /auth/me`), JWT |
| Expert (vet or agriculture officer) | `/expert` | Staff-style login (`POST /staff/login`, `/staff/refresh`, `/staff/logout`, `/staff/me`) with an expert/field-officer role. Confirm the exact role name in the backend's staff module. |
| Admin / staff | `/admin` | Staff login as above |

Guard routes by role, refresh tokens silently, and log the user out cleanly on 401.

## 4. Farmer portal (`/app`)

Mirror the USSD menu and add web-only depth.

1. **Onboarding and profile.** Registration happens on USSD, and the profile is finished on SMS. The website must let a farmer finish or edit the same profile (`profile_complete`).
   - Includes a **map location picker**: a Kenya-only OSM map where the farmer taps or drags a pin, or taps "Use my current location". Save latitude, longitude, sub-county and ward, and show the county the pin falls in.
   - Also collects farm size, crops grown and livestock kept (`/farmer-crops`, `/farmer-livestocks`).
2. **Dashboard.** Today's weather and a 7-day outlook (OpenWeather, via backend). A "How is my farm doing?" card showing vegetation health (NDVI) and rainfall versus normal (Google Earth Engine, via backend). Show one plain sentence of interpretation, for example "Your area is greener than usual this month", with the chart secondary. Show open expert requests and unread alerts.
3. **Crop recommendations.** See section 7 for the card design.
4. **Livestock recommendations.** Same pattern, with breeds, feed plan, housing and vaccination calendar.
5. **Disease and pest risk.** Weather-driven risk level for the farmer's crops and animals, with prevention steps. Also show **outbreak alerts near me** (a map with radius and an alert list).
6. **Market prices.** Prices for the farmer's crops at the **nearest markets** (use the saved pin), with a trend chart and a "best place to sell this week" highlight. Allow the farmer to choose a different market.
7. **Ask an expert.** A simple form with issue type (crop or livestock), symptom checklist with large icon buttons, urgency (emergency, soon, general advice), optional note, and preferred time. After submitting, show a **reference code** and a status tracker: Pending, Offered, Accepted, Completed. Experts' phone numbers are shown only after acceptance. Let the farmer cancel, and when completed, confirm "Was your problem solved?".
8. **Agrovets and products.** See the business module in section 7.
9. **Notifications**, **subscription and payment** (M-Pesa STK push status and pricing class from `/me/subscription-quote`), and **settings** (language, PIN change, notification preferences).

## 5. Expert portal (`/expert`)

1. **Queue.** New offers with a visible countdown to expiry, urgency badges, distance from the expert, and Accept or Decline (with an optional reason).
2. **Case brief.** Everything needed before the first call: farmer name and county, a map with the farm pin, symptoms and urgency, the farmer's crops and livestock, recent weather and NDVI for the area, and active outbreak alerts nearby.
3. **My cases.** Accepted, in progress and completed. Add notes, mark complete, and request escalation.
4. **Availability and coverage.** A toggle (`PATCH /admin/me/availability`) and a service-area editor (counties or sub-counties).
5. **Performance.** Response time, completed cases, and farmer feedback.

## 6. Admin console (`/admin`)

1. **Overview.** KPIs (farmers, active subscriptions, requests per day, median time to assignment, unassigned count), with charts.
2. **Farmers**, **Experts**, **Staff**: tables with search, filters, detail drawers and edit actions.
3. **Expert requests.** A board of Pending, Offered, Accepted, Completed, Unassigned and Escalated. Manual reassign, with the assignment score shown for each candidate. A settings panel for score weights (workload, time since last assignment, response rate, proximity) and offer timeouts.
4. **Outbreak monitor.** A Kenya map with a heatmap and clusters by symptom, species or crop, and week. Thresholds for raising an alert, a button to review and send an SMS alert to farmers in a radius, and an alert history.
5. **Market prices.** View prices, trigger a scrape (`POST /admin/market-prices/scrape`), and manage the list of markets and their coordinates.
6. **Advisories**, **Products and vendors**, **Pricing and subscriptions**, **Quotes**, **SMS sessions** (debug view), **Audit log**.

## 7. Recommendation and business module (important)

The system must never say just "maize" or "dairy cattle". Every recommendation card must contain:

- **Specific variety or breed** (for example a named maize variety suited to the altitude and rainfall, or a named dairy or poultry breed), why it fits this farm (rainfall, altitude, soil, season, NDVI trend), expected maturity time, and key risks.
- **Other suggestions**: two or three alternatives ranked, intercropping or rotation tips, planting window, and spacing or stocking density.
- **Where to get it**: nearby agrovets and certified suppliers on a map and in a list, sorted by distance, with phone, opening hours and a call or WhatsApp button.
- **Inputs and products**: matching seed, feed, fertiliser, vaccines and tools, each with a vendor, indicative price, unit and stock status.
- **Confidence and honesty**: a short "why we suggest this" explanation and a note that this is guidance, not a guarantee. Link to "Ask an expert" for anything uncertain.

Business module screens:

- **Vendor directory**: search, filter by county, category and product, and a map view.
- **Vendor profile**: products, prices, contact details and ratings.
- **Vendor portal** (a fourth, small role): vendors manage their shop profile, products, prices and stock, and see how many farmers viewed or contacted them. Treat this as phase 4 and design the data model for it now.

## 8. Backend contract

Use the existing API where it exists. Create a typed API client, one module per resource. **Do not invent endpoints silently.** Where an endpoint is missing, mock it behind the same typed interface and list it in `docs/missing-endpoints.md`.

**Existing endpoints** (confirm shapes in the OpenAPI docs at `/docs`):

- Auth: `POST /auth`, `GET /auth/me`
- Farmers: `/farmers` (CRUD), `/farmer-crops`, `/farmer-livestocks`
- Experts: `GET /experts`; Expert requests: `POST` and `PATCH /expert-requests`
- Market prices: `GET /market-prices`, `/county/{county_id}`, `/crop/{crop_id}`
- Advisories: `/advisory` (CRUD, by category and county)
- Products: `/products` (CRUD, by category)
- Notifications: `GET /notifications`
- Pricing: `GET /me/subscription-quote`
- Staff: `/staff/login`, `/refresh`, `/logout`, `/me`
- Admin: `/admin/overview`, `/farmers`, `/experts`, `/expert-requests`, `/advisories`, `/products`, `/market-prices`, `/pricing`, `/subscriptions`, `/quotes`, `/sms-sessions`, `/audit`, `/staff`, `/field-officers`, `/me/availability`

**Endpoints and data the backend still needs** (build the UI against mocks until they exist):

- Farmer location: `latitude`, `longitude`, `sub_county`, `ward` on the farmer profile. Today only the county is stored.
- Crop varieties and livestock breeds catalogue with suitability attributes (altitude, rainfall, maturity, risks).
- A recommendation endpoint returning the structured card in section 7 (variety, alternatives, sourcing, product matches).
- Vendors (name, location, county, contact, hours, rating) and per-vendor product price and stock. Today's `products` has no vendor, price or stock.
- Markets with coordinates, and a "nearest markets" query.
- Expert offers (request, expert, offered at, responded at, response) and the status states Offered, Unassigned and Escalated.
- Symptom codes, urgency, `channel` (ussd, sms or web) and a reference code on expert requests.
- Outbreak signals: aggregated counts by area, symptom and week, plus alert create and list endpoints.
- A farm-conditions snapshot: current weather, forecast, NDVI and rainfall for a coordinate.

## 9. Delivery plan

Work in phases and stop after each for review:

1. Design system (tokens, components, layout shells for the three portals), auth and role routing, and the typed API client.
2. Farmer onboarding with the Kenya map location picker, then the dashboard.
3. Expert request flow end to end across all three portals.
4. Recommendations and the business module (vendor directory, product matching).
5. Market prices with nearest-market logic.
6. Outbreak monitor and alerts.
7. Polish: Kiswahili translations, PWA and offline behaviour, accessibility audit, and tests (Vitest for logic, Playwright for the critical flows).

Start with phase 1. Begin by proposing the folder structure, the colour and typography tokens, and the page map, then wait for my approval before writing code.
