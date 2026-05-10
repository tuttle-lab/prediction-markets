# Kickstart

A reusable full-stack project template. Fork this to start new projects with the deployment wiring already done.

**Stack:** React + Vite · FastAPI (Python) · Vercel · Three-theme UI (light / dark / amber)

**Live:**
- Production: https://kickstart-xi-eight.vercel.app
- API docs: https://kickstart-xi-eight.vercel.app/api/docs

---

## Quick start

```bash
# 1. Install dependencies
npm install
pip install -r api/requirements.txt   # or: pip install -r api/requirements.txt inside a venv

# 2. Copy and fill in env vars
cp .env.example .env

# 3. Run both servers
uvicorn api.index:app --reload         # API on :8000
npm run dev                            # Frontend on :5173 (proxies /api → :8000)
```

---

## Forking for a new project

1. Fork or clone this repo
2. Edit `kickstart.config.yml` — update `name`, `github_repo`, `vercel_production_url`, and `github_pages_base_path`
3. Fill in `.env` with your real values (see `.env.example`)
4. For secrets (service role keys etc.) add them to `.secrets/` — see `.secrets/supabase.env` as a template
5. Run `./scripts/setup.sh` — sets GitHub Actions variables/secrets and enables Pages
6. Push — Vercel and/or GitHub Pages deploy automatically

---

## Deployment

### Vercel (recommended)

Vercel hosts both the React frontend and the FastAPI backend as serverless functions in a single deployment.

**Use Vercel when:**
- Your project has a backend / API
- You want a single URL for everything
- You need `/docs` (Swagger UI) and `/redoc`
- You want zero infrastructure to manage

**Setup:** Import the repo at vercel.com/new. Vercel auto-detects Vite + Python. Set env vars in the Vercel dashboard or via the CLI.

### GitHub Pages (static-only alternative)

GitHub Pages serves the built React frontend only. API calls must point to an external URL (Vercel or otherwise) via `VITE_API_URL`.

**Use GitHub Pages when:**
- The project is pure frontend with no backend
- You want free hosting with no external accounts
- You're forking kickstart to build a static site or docs site

**Setup:** `./scripts/setup.sh` enables Pages and sets the correct `VITE_API_URL` variable automatically.

> **Note:** `/docs` and `/redoc` are FastAPI routes — they are never available on GitHub Pages.

---

## Project structure

```
kickstart/
├── api/                          # FastAPI backend
│   ├── db/
│   │   ├── interface.py          # Abstract DatabaseClient (swap DB here)
│   │   └── supabase.py           # Supabase implementation
│   ├── deps.py                   # Dependency injection (get_db)
│   └── index.py                  # Route definitions
├── src/
│   ├── components/               # Header, ThemeToggle, PingPanel, StatusBar
│   ├── hooks/
│   │   ├── useTheme.js           # Theme state + localStorage persistence
│   │   ├── useApi.js             # Generic fetch wrapper
│   │   └── useDb.js              # Database hook
│   ├── lib/db/
│   │   ├── interface.js          # JS DatabaseClient base class
│   │   └── supabase.js           # Supabase JS implementation
│   └── styles/
│       ├── themes.css            # CSS custom properties for all 3 themes
│       └── global.css            # Layout primitives, buttons, badges
├── scripts/
│   └── setup.sh                  # One-shot project wiring script
├── kickstart.config.yml          # Source of truth for project config
├── vercel.json                   # Vercel routing (frontend + API + docs)
└── .github/workflows/
    └── deploy-pages.yml          # GitHub Pages deployment
```

---

## Themes

Three themes driven by CSS custom properties — swap with one `data-theme` attribute on `<body>`. Preference persists in `localStorage` and respects `prefers-color-scheme` on first visit.

| Theme | Aesthetic |
|---|---|
| `light` | Clean, neutral |
| `dark` | Standard dark UI |
| `amber` | Phosphor CRT — Alien/Nostromo terminal vibes |

---

## Swapping the database

The DB layer is fully abstracted. To switch from Supabase to any other database:

**Backend** — edit one line in `api/deps.py`:
```python
return SupabaseClient(...)   # ← replace with PostgresClient(), etc.
```

**Frontend** — edit one line in `src/lib/db/index.js`:
```js
export const db = new SupabaseClient()  # ← replace with any DatabaseClient subclass
```

Both implement the same `select / insert / update / delete / rpc` interface defined in `api/db/interface.py` and `src/lib/db/interface.js`.

---

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `VITE_API_URL` | Frontend | API base URL. Unset on Vercel (same-origin). Set to Vercel URL for GitHub Pages. |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL (public) |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anon key (public) |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase service role key (secret) |
