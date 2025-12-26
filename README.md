# Nutrify 🥗

Meal discovery & planning web app.

## 🎯 Problem Statement
People often struggle with the question *"What should I eat?"*, leading to repetitive meals, food waste, and disorganized grocery shopping. 

---

Nutrify helps users **discover recipes**, **plan meals** on a calendar, manage a **fridge inventory**, and automatically generate an **shopping list**. The project is a **monorepo** containing:

- **Frontend**: Next.js (TypeScript) + Mantine UI
- **Backend API**: Python (Flask) + SQLAlchemy + JWT
- **Data/DB assets**: PostgreSQL schema + seed scripts + Firebase rules (Storage/Hosting)

---

## Tech Stack

### Frontend
- Next.js (App Router) + TypeScript
- Mantine UI
- Firebase Storage (recipe image uploads)

### Backend
- Python 3.11
- Flask + Flask-OpenAPI3 (Swagger/OpenAPI)
- Flask-JWT-Extended (JWT auth)
- Flask-SQLAlchemy + pg8000 (PostgreSQL)
- Flask-Mail (email flows)
- Flask-Admin (admin panel)

### Database / Infra
- PostgreSQL
- Docker 
- Firebase Hosting + Cloud Run (deployment is configured via GitHub Actions workflows in `.github/workflows/`)

---

## Repository Structure

```text
.
├── backend/                 # Flask API (JWT, SQLAlchemy, Admin, OpenAPI)
│   ├── app/                 # Feature modules (auth, recipe, planning, ...)
│   ├── tests/               # Pytest tests
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # Next.js UI (Mantine)
│   ├── app/                 # Pages/routes
│   ├── components/
│   ├── lib/
│   ├── Dockerfile
│   └── package.json
├── database/                # DB schema + seed data + Firebase rules
│   ├── sql/schema.sql
│   ├── load_data.py         # Seed recipes/ingredients into Postgres via backend models
│   ├── recipes.json         # Seed dataset (example)
│   ├── firestore.rules      # Firebase rules (optional/local emulation)
│   └── firestore.indexes.json
└── firebase.json            # Firebase Hosting rewrites (frontend + backend Cloud Run)
```

---

## Prerequisites

- **Node.js 20+** (for frontend)
- **Python 3.11** (for backend)
- **Docker Desktop** (recommended — easiest way to run Postgres)
- (Optional) **Firebase CLI** if you want to use emulators / deploy Firebase Hosting

---

## Environment Variables

### Backend (`backend/.env`)

Create a file at `backend/.env` (the backend loads dotenv from the `backend/` folder).

Start from `backend/.env.example`:

```dotenv
# Secrets
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me-too

# Database (local)
DATABASE_URL=postgresql://postgres:12345@127.0.0.1:5433/nutrify_db
TEST_DATABASE_URL=postgresql://postgres:12345@127.0.0.1:5433/nutrify_test_db

DB_USER=postgres
DB_PASSWORD=12345
DB_NAME=nutrify_db

# Email (optional for auth flows like verification/reset)
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USE_TLS=1
MAIL_USE_SSL=0
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_DEFAULT_SENDER=

# Docs/Admin toggles
ENABLE_DOCS=1
ADMIN_URL=/admin

# Firebase Storage public base URL (used to build image URLs)
FIREBASE_STORAGE_BASE_URL=
```

Notes:
- `ADMIN_URL` can be left empty to disable the admin panel.
- `FIREBASE_STORAGE_BASE_URL` is required to generate public image URLs (used by `backend/app/utils/storage.py`).

### Frontend (`frontend/.env.local`)

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Firebase (required only if you use image upload features)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID_PREPROD=
NEXT_PUBLIC_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

---

## How to Run (Docker Images)

This repo contains Dockerfiles for both services.

### Backend
```bash
docker build -t nutrify-backend ./backend
docker run --rm -p 8080:8080 --env-file ./backend/.env nutrify-backend
```

### Frontend
```bash
docker build -t nutrify-frontend ./frontend
docker run --rm -p 3000:3000 --env-file ./frontend/.env.local nutrify-frontend
```

> There is **no** `docker-compose.yml` in the repository right now. If you want one, you can add it to orchestrate Postgres + backend + frontend in one command.

---

## API Documentation (OpenAPI / Swagger)

The backend uses **Flask-OpenAPI3**. If `ENABLE_DOCS=1`, interactive docs will be available under an OpenAPI route (commonly something like `/openapi` or `/openapi/swagger`).  
If you’re unsure which path your version exposes, check the backend startup logs or list routes from Flask.

---

## Deployment Notes (Firebase Hosting + Cloud Run)

This repo includes GitHub Actions workflows that deploy:
- **backend** to **Cloud Run** on pushes to `develop` affecting `backend/**`
- **frontend** to **Cloud Run** on pushes to `develop` affecting `frontend/**`
- Firebase Hosting rewrites are configured in `firebase.json` to route:
  - `/**` → frontend service
  - `/meals`, `/meal/**` → backend service

See `.github/workflows/` for required secrets and deployment configuration.

---

## Troubleshooting

### “Could not import 'app'” when running Flask
Use the correct Flask app module:

```bash
flask --app backend.app run
```

(or set `PYTHONPATH=.` and avoid running from inside the `backend/` folder).

### Database connection errors
- Verify Postgres is running and port mapping is correct (`5433 -> 5432`)
- Confirm `DATABASE_URL` in `backend/.env`
- Ensure `nutrify_db` exists (and `nutrify_test_db` for tests)

### Port already in use
Change ports locally:
- Backend: run Flask with `--port 8081`
- Frontend: `npm run dev -- -p 3001` (or set `PORT=3001`)

---

## License

