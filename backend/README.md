# ReputeX Backend

Secure API gateway + **genuine, deterministic** token risk scoring engine for
ReputeX AI. Holds all provider API keys server-side (they never reach the
browser) and exposes a single analysis endpoint.

- Security model & hardening: [`../SECURITY.md`](../SECURITY.md)
- Scoring methodology: [`./SCORING.md`](./SCORING.md)

## Quick start

```bash
cd backend
cp .env.example .env      # then fill in real API keys
npm install
npm run dev               # http://localhost:8787 (watch mode)
```

Production:

```bash
npm run build && npm start
```

## Environment

See `.env.example`. Keys are **optional** — the server boots without them and
each missing provider simply lowers analysis confidence (it never fabricates
data). One **Etherscan V2** key covers all supported EVM chains.

## API

### `GET /health`
Liveness + which providers are configured + supported networks.

### `POST /api/v1/analyze`
```jsonc
// request
{ "address": "0x...", "network": "ethereum" | "auto", "skipAi": false }
```
```jsonc
// response (abridged — see src/scoring/types.ts for the full type)
{
  "address": "0x...",
  "network": "ethereum",
  "addressType": "contract",
  "trustScore": 68,            // 0-100, higher = safer
  "verdict": "Probably OK",
  "confidence": 0.85,          // 0-1, how much real data backed the score
  "pillars": [ { "key": "tradability", "score": 72, "weight": 0.3, "available": true }, ... ],
  "reasons": [ { "severity": "high", "message": "...", "evidence": "sell tax 38%", "source": "honeypot.is" } ],
  "riskFactors": [ "..." ],
  "recommendations": [ "..." ],
  "token": { "name": "USD Coin", "symbol": "USDC", "liquidityUsd": 1234567, ... },
  "honeypot": { "checked": true, "isHoneypot": false, "buyTax": 0, "sellTax": 0 },
  "dataSources": { "honeypot": true, "etherscan": true, "dexscreener": true, ... },
  "scores": { "trust_score": 68, ... },  // legacy-compatible projection for the UI
  "ml": { ... }                          // MLAnalysisCard-compatible projection
}
```

Example:
```bash
curl -s -X POST http://localhost:8787/api/v1/analyze \
  -H 'Content-Type: application/json' \
  -d '{"address":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","network":"ethereum"}'
```

## Telegram bot

A Telegram bot reuses the same scoring engine (no duplicate logic). Send it any
token address and it replies with the trust score + key risks.

```bash
# 1. Create a bot with @BotFather on Telegram, copy the token into backend/.env:
#    TELEGRAM_BOT_TOKEN=123456:ABC...
#    WEB_APP_URL=https://your-frontend-url   (for the "Full report" button)
# 2. Run it:
npm run bot        # dev (watch)
# or in production: npm run build && npm run start:bot
```

Commands: `/start`, `/help`, `/scan 0x…`, or just paste an address. The bot
auto-detects the chain and replies with a formatted card + inline buttons
("Full report", "Explorer").

## Architecture

```
src/
├── index.ts            Express bootstrap (helmet, CORS allowlist, rate limit)
├── config/env.ts       zod-validated environment + provider status
├── chains.ts           EVM chain registry (Etherscan V2 multichain)
├── lib/                http (timeout+retry+redact), ttl cache, logger
├── services/
│   ├── explorer.ts     Etherscan V2: code, source, creation, owner(), holders
│   ├── honeypot.ts     honeypot.is live buy/sell simulation
│   ├── dexscreener.ts  liquidity depth, volume, pair age
│   ├── moralis.ts      real holder distribution (top-10 supply %, total holders)
│   ├── coingecko.ts    market + community
│   ├── gemini.ts       AI EXPLANATION layer (never sets the score)
│   └── analyze.ts      orchestrator: real chain/contract detection + fan-out
├── scoring/
│   ├── signals.ts      static source red-flag scanner
│   ├── engine.ts       weighted pillars + veto caps + confidence  ← the core
│   └── types.ts        canonical result shape
├── middleware/         validate (zod), rateLimiter, errorHandler
└── routes/             health, analyze
```

## Data sources & keys

| Provider | Key needed | Used for |
|---|---|---|
| honeypot.is | no | buy/sell simulation, real tax |
| Dexscreener | no | liquidity, volume, price |
| Etherscan V2 | **yes** (1 key, all chains) | verification, source, creation, owner, holders (fallback) |
| Moralis | optional | **holder distribution** (top-10 supply %, total holders) |
| CoinGecko | optional | market + community |
| Gemini | optional | natural-language explanation only |

## Scaling notes

The in-memory cache (`lib/cache.ts`) and rate-limit store are per-instance.
For multiple instances, swap both for **Redis** (the cache exposes a tiny
get/set/cached interface that maps 1:1 to Redis). Add a DB for persistent
analysis history and an auth layer before exposing the API publicly.
