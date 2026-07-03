# Tertip — Agent Guide

Project files live under `public_html/` (GitHub repo root).

## Structure

```
public_html/
├── backend/     # Express API (modular MVC)
├── frontend/    # Vue 3 + Tailwind (scaffold pending)
└── .cursor/rules/
```

## Backend MVC pattern

Every feature module under `backend/src/modules/{user|admin}/{module}/`:

- `{module}.routes.js` — HTTP routes + middleware chain
- `{module}.controller.js` — request handling (`{module}Controller`)
- `{module}.model.js` — PostgreSQL queries (`{module}Model`)
- `{module}.view.js` — JSON serializers (`{module}View`)

Mount modules in `routes/user.routes.js` or `routes/admin.routes.js`.

## Reference module

`modules/user/library/` — CRUD for `sources` table at `/api/v1/user/library/sources`.

## Implementation order

| Step | Scope |
|------|--------|
| 1 | Express boilerplate, DB pool, i18n, Dockerfile ✅ |
| 2 | User + Admin auth, JWT, device_id sessions ✅ |
| 3 | Google OAuth, Drive library storage ✅ |
| 4 | Tiptap footnotes → Google Docs one-way sync ✅ |
| 5 | AI endpoints + matrix comments ✅ |
| 6 | Vue A4 editor UI ✅ |

## Key constraints

- Express (not NestJS) for Cloud Run cold-start performance.
- One-way sync: Tertip → Google Docs only.
- Zero server-side file storage; Drive file IDs in DB only.
- `JWT_USER_SECRET` ≠ `JWT_ADMIN_SECRET`.

## Database

Schema: `backend/migrations/001_initial_schema.sql`

Run against PostgreSQL before using library or auth modules.

## Local dev

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Health check: `GET /api/v1/health` (requires `DATABASE_URL`).

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173` (proxies `/api` → backend `:8080`).
