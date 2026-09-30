# Agritech AI

Staff console for Agritech (platform admins and field officers). Farmers still use USSD/SMS on the API — this repo is the web dashboard only.

## Connect to the deployed API

Set this on Vercel (or in `.env.local` for local work):

```
NEXT_PUBLIC_API_URL=https://YOUR-DEPLOYED-API-HOST
```

No trailing slash. The app calls `/backend/...` on this Next server; that route forwards only `/staff/*` session paths and `/admin/*` to the API.

The live API must already expose `/staff/login` and `/admin/overview`. Farmer routes (`/ussd`, `/sms`, `/mpesa/callback`) stay on the API and are not used by this site.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The API should be running at the URL in `.env.local` (default `http://127.0.0.1:8000` if unset).

## Deploy on Vercel

1. Import this repository.
2. Root Directory: leave as `.` (this repo is the Next app).
3. Add `NEXT_PUBLIC_API_URL` for Production.
4. Deploy, then open the Vercel URL and sign in with a staff account from the API.
