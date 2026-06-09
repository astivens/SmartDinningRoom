# SmartComedor — Agent Instructions

Full-stack university dining management system. React 18 + Vite + MUI 5 (`client/`) · Express + TypeScript + Sequelize + PostgreSQL (`server/`).

---

## Startup

**Recommended (Docker):**
```bash
docker compose --profile dev up --build   # backend:3002 frontend:5174 db:5433
docker compose --profile prod up --build  # builds + nginx on :80
```

**Manual (each in its own terminal):**
```bash
cp .env.example server/.env              # then edit secrets
cd server && npm install && npm run dev  # default :3001, but .env.example sets :3002
cd client && npm install && npm run dev  # :5174
```

---

## Critical gotchas

- **Port mismatch**: Server `index.ts` defaults to `PORT=3001` but `.env.example` and docker-compose use `3002`. CORS defaults to `http://localhost:5173` but Vite dev server runs on `5174`. Always copy `.env.example` and set `CLIENT_URL` to match.
- **DB sync in dev**: `connectDB()` calls `sequelize.sync({ alter: true })` in development — **can drop columns**. Do not rely on sync for schema changes; use Sequelize CLI migrations instead.
- **Env file location**: Docker reads `server/.env` (not root `.env`). Manual mode needs `.env` inside `server/`.
- **Tests run from server dir**: `cd server && npm test`. Tests live in `server/src/tests/` matching `**/tests/**/*.test.ts`.

---

## Architecture

| What | Where |
|------|-------|
| Server entry | `server/src/index.ts` — Express app, mounts all routes under `/api` |
| Route index | `server/src/routes/index.ts` — aggregates 10 route modules + `/api/health` |
| DB config | `server/src/config/database.ts` — Sequelize instance, `connectDB()` with `alter: true` in dev |
| Models | `server/src/models/` — 11 models (User, Student, Cycle, Payment, MealAttendance, etc.) |
| Auth middleware | `authenticate` (401), `authorize(...roles)` (403), `optionalAuth` (non-blocking) |
| Upload middleware | multer → `uploads/`, PDF/JPEG/PNG only, 10 MB max |
| Client entry | `client/src/main.tsx` → React 18 + MUI 5 |
| Client path alias | `@/` maps to `client/src/` (Vite + tsconfig `paths`) |
| API proxy | Vite proxies `/api` → `API_PROXY_TARGET` (default `http://localhost:3002`) |

**Route prefix**: every module mounts under `/api`, e.g. `/api/auth`, `/api/students`, `/api/meals`, `/api/payments`, etc.

---

## Tests

```bash
cd server
npm test                    # all tests (jest)
npm run test:unit           # --testPathPattern=tests/unit
npm run test:integration    # --testPathPattern=tests/integration
npm run test:coverage       # jest --coverage
```

Jest config: `server/jest.config.ts` — ts-jest preset, node env, 10s timeout, test pattern `**/tests/**/*.test.ts`.

---

## Key conventions

| Layer | Convention |
|-------|------------|
| Controllers | Async `(req, res, next)`, errors via `next(error)`, standard HTTP codes |
| Models | Sequelize — `snake_case` plural tables, `PascalCase` models, `timestamps: true`, `underscored: true` |
| Auth | JWT payload `{ userId, role, iat, exp }`; refresh tokens in DB with `revokedAt` |
| Error handling | `AppError` class + centralized `errorHandler` middleware; JSON format `{ success: false, message, errors? }` |
| Config | Centralized config object (never raw `process.env`) |
| Logging | Structured logger (winston/pino) — no `console.log` in production |
| Frontend | MUI 5 + Material Design 3, Spanish UI copy, accessible forms with visible labels |
| Lint | `cd client && npm run lint` (eslint, zero-warnings mode) |
| Backend skill | `.opencode/skills/backend/SKILL.md` — detailed conventions for controllers, error handling, models, JWT, TOTP, OCR |
| Frontend rules | `.cursor/rules/ui-ux-frontend.mdc` — MUI/MD3 design system, component patterns, Spanish copy |

---

## CI/CD

GitHub Actions in `.github/workflows/security-tests.yml` — 6 jobs (ZAP, JMeter security, load test, stress test, BrowserStack, summary). Runs on push to `main`/`develop`, PRs to `main`, weekly Mondays, or manual dispatch. Uses `docker compose --profile dev`.

---

## Project conventions

- Commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:` prefix
- Branch from `main`: `feature/description`, `fix/description`
- Sequelize migrations for schema changes (not `sync`)
- Student registration requires SISBEN document + front/back of ID + schedule (PDF)
- Payments require university receipt + bank receipt (both optional at initial registration)
