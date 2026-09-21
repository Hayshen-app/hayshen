# HayShen

React նախագիծ՝ կառուցված TypeScript-ով (TSX)։

`@` կեղծանունը հղվում է `src` թղթապանակին (see `tsconfig.json` → `paths`, and
the matching webpack alias in `craco.config.js`).

```tsx
import Header from '@/components/Header/Header';
```

## Հրամաններ

- `npm start` — գործարկել տեղային մշակման միջավայրը
- `npm run build` — ստեղծել production տարբերակը
- `npx tsc --noEmit` — type-check without emitting (also runs automatically
  in `npm start`/`npm run build` via react-scripts' fork-ts-checker)

## Backend connection

`REACT_APP_API_BASE_URL` (see `.env.example`) is the only env var this app
reads — CRA only exposes vars prefixed `REACT_APP_`. Copy `.env.example` to
`.env` and point it at your backend (defaults to
`http://localhost:8080/api/v1` if unset). Every request goes through
`src/api/client.ts`.

## Կառուցվածք

```text
src/
├── App.tsx
├── App.scss
├── index.tsx
├── index.scss
├── types/       # shared TS types (API envelope, enums, auth)
└── admin/       # Admin Console (see below)
```

## Admin Console

`/admin` is the staff-facing Admin Console for `hayshen-backend`'s Admin API
(dashboard, users, contractor companies, orders/dispatch, categories, and
settings — see the backend's `admin` package). It shares this project's build
and routing but is otherwise self-contained under `src/admin/`, and its UI is
in English (the rest of the site is Armenian) to match the backend's domain
terms.

- Sign in at `/admin/login` with an account whose role is `ADMIN` or
  `SUPPORT` — the seeded admin is `admin@hayshen.am` / `Admin123!` (change it
  before shipping). It reuses the same login/session as the public site, so
  signing in with a customer or contractor account will show "Access denied"
  rather than a customer dashboard.
- Data fetching/caching uses `@tanstack/react-query`; routing uses
  `react-router-dom`. Both are only used under `src/admin/`.
- `src/admin/api/http.ts` wraps every admin request with the existing
  `apiRequest` helper and adds a one-time refresh-and-retry on a 401 before
  falling back to logging the user out.
- Request/response shapes for every admin endpoint are typed in
  `src/admin/types.ts`, mirrored from the backend's DTOs
  (`admin/dto/*.java`, `order/dto/*.java`, `catalog/dto/*.java`).
