# ReputeX AI

AI-powered, multi-chain **blockchain reputation & token risk analysis**. Paste a
token/contract address and get a transparent Trust Score (0–100) with the real
evidence behind it — honeypot simulation, contract verification, liquidity depth,
holder concentration and more.

## Architecture

ReputeX is now a **two-part app**:

| Part | Stack | Role |
|---|---|---|
| **`/` (frontend)** | Vite + React + TS + Tailwind + shadcn/ui | UI. Holds **no** API keys. Calls the backend. |
| **`/backend`** | Node + Express + TS | Holds all provider keys, runs the **genuine deterministic scoring engine**, fans out to data providers. |

```
Browser (no keys) ──▶ ReputeX backend (keys here) ──▶ Etherscan / honeypot.is /
                                                       Dexscreener / CoinGecko / Gemini
```

- 🔐 Security model: [`SECURITY.md`](./SECURITY.md)
- 🧮 How the score works: [`backend/SCORING.md`](./backend/SCORING.md)
- ⚙️ Backend API & setup: [`backend/README.md`](./backend/README.md)

## Run it locally

**1. Backend** (terminal 1):
```bash
cd backend
cp .env.example .env      # fill in real API keys
npm install
npm run dev               # http://localhost:8787
```

**2. Frontend** (terminal 2):
```bash
cp .env.example .env      # sets VITE_API_BASE_URL=http://localhost:8787
npm install
npm run dev               # http://localhost:8080
```

Open http://localhost:8080 and analyze a token.

## Environment / secrets

- **All provider keys live in `backend/.env`** (gitignored, server-side only).
- The frontend `.env` contains only `VITE_API_BASE_URL`.
- `.env.example` files document what's needed.

> ⚠️ The original keys were committed to a public repo and **must be rotated** —
> see [`SECURITY.md`](./SECURITY.md) §2.

## What changed (vs. the original prototype)

- Moved all 7 API keys out of the browser into a secure backend.
- Replaced fabricated `Math.random()` risk values (chain detection,
  contract/wallet detection, owner concentration, honeypot, holder counts) with
  **real on-chain / API data**.
- Added a **deterministic, transparent scoring engine** (5 weighted pillars +
  veto caps + honest confidence). AI is now explanation-only and can't overwrite
  the score.

## Roadmap (high level)

Persistent DB for history & trends · public API with auth + quotas · real holder
distribution & LP-lock detection · labelled-dataset calibration of the score ·
alerts/webhooks. See `backend/SCORING.md` and `SECURITY.md` for specifics.
