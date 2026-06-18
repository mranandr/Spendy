# ExpenseIQ

Personal finance app with **live Zerodha & Groww portfolio sync**, **Supabase Auth + Postgres**, and **AI portfolio insights** via a FastAPI orchestrator.

## Architecture

```
expence-app/
├── client/          Expo (React Native) — Expo Router + Zustand
├── server/          FastAPI — broker proxies, AI orchestrator, rate limits
└── supabase/        Postgres schema + RLS migrations
```

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Mobile | Expo Router + Zustand | UI, local cache, Supabase session |
| Auth | Supabase Auth + SSO | Email/password, Google OAuth |
| Data | Supabase Postgres + RLS | Accounts, transactions, budgets, investments |
| API | FastAPI | Broker sync, encrypted tokens, AI with user context |
| Rate limit | Upstash Redis | Per-user limits on AI + broker sync |
| Broker tokens | Postgres (Fernet encrypted) | Never on device; service role only |

Broker and AI API keys stay on the server. The mobile app sends a Supabase JWT; FastAPI validates it and acts on behalf of the user.

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial.sql` in the SQL editor
3. Enable Google OAuth under Authentication → Providers (redirect: `client://auth/callback`)
4. Copy **Project URL**, **anon key**, and **JWT secret** (Settings → API)

### 2. FastAPI server

```bash
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — Supabase, encryption key, brokers, AI, Upstash
uvicorn main:app --host 0.0.0.0 --port 5050 --reload
```

Health check: `http://localhost:5050/api/health`

Generate encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Mobile client

```bash
cd client
cp .env.example .env
# EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run start
```

Sign in → **Investments** → connect brokers → **Ask Claude** / **Ask Gemini**.

---

## API reference

All routes except `/api/health` require `Authorization: Bearer <supabase_access_token>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service status |
| GET | `/api/brokers/status` | Connected brokers (no tokens exposed) |
| DELETE | `/api/brokers/{provider}` | Disconnect broker |
| POST | `/api/brokers/zerodha/refresh` | Re-sync using server-stored token |
| GET | `/api/zerodha/login-url` | Kite OAuth URL |
| POST | `/api/zerodha/sync` | `{ requestToken }` initial connect |
| POST | `/api/groww/sync` | `{ accessToken? }` optional pasted token |
| POST | `/api/ai/insights` | `{ provider, holdings }` — orchestrator adds DB context |

---

## Migration from v1 (mock auth + SecureStore)

| Before | After |
|--------|-------|
| Mock `authStore` login | Supabase email + Google SSO |
| `brokerStore` tokens in SecureStore | Connection flags only; tokens in `broker_connections` table |
| `financeStore` in SecureStore | **Phase 2:** sync to Supabase tables with RLS |
| Direct AI call with holdings JSON | AI orchestrator merges holdings + profile + recent txs |
| No rate limits | Upstash Redis per-user hourly caps |

---

## Broker & AI setup

See previous README sections for Zerodha Kite, Groww Trade API, and AI keys (`OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_API_KEY`).

Insights are educational only — not financial advice.
