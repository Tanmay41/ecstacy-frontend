# Ecstacy Dashboard — Next.js Frontend

Admin/owner dashboard for the Ecstacy cheat ecosystem. Built with Next.js 16 App Router.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS — styling utility classes

## Pages

| Path | Page | Access |
|------|------|--------|
| `/` | Dashboard — stats overview | Admin/Owner |
| `/login` | Login | Public |
| `/users` | User list, search, suspend | Admin/Owner |
| `/keys` | Key management, generate, revoke, extend | Admin/Owner |
| `/versions` | Menu version upload + management | Owner |
| `/settings` | Global settings | Owner |
| `/admin` | Admin management (add/remove admins) | Owner |

## Architecture

The frontend is a **separate** app from the backend Express server:
- Frontend (Next.js) runs on `:5173` — handles rendering only
- Backend (Express) runs on `:3000` — handles all API/data logic
- API calls go directly to the Express backend from the browser

## Getting Started

```powershell
npm install
npm run dev    # Starts on :5173
```

## Environment

Configured in `src/env.ts` using Next.js 16 built-in env handling:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `http://localhost:4000`) |

## Project Structure

```
src/
├── app/               # App Router pages + layouts
│   ├── layout.tsx     # Root layout (no auth check)
│   ├── login/         # Login page
│   ├── dashboard/     # Dashboard (protected)
│   ├── users/         # User management (protected)
│   ├── keys/          # Key management (protected)
│   ├── versions/      # Version upload (protected)
│   ├── settings/      # Settings (protected)
│   └── admin/         # Admin management (protected)
├── components/        # Shared React components
├── lib/               # API client, auth helpers
└── env.ts             # Environment variable config
```

## Auth Flow

1. User logs in via login page → Express returns JWT
2. JWT stored in localStorage
3. Every API call includes `Authorization: Bearer <token>`
4. Protected pages redirect to `/login` if no token
