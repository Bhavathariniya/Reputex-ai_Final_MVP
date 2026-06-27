# ReputeX AI — Security Analysis & Hardening

This document is a senior-level security review of the project and a record of
what has been fixed, what remains, and the recommended path to production.

---

## 1. Architecture change: why a backend was the #1 security fix

**Before:** the app was a pure browser SPA that called Etherscan, Moralis,
Alchemy, Bitquery, CoinGecko, LunarCrush and Gemini **directly from the user's
browser**, with all seven API keys hardcoded in the source. Any visitor could
open DevTools and read every key. Moving them to a frontend `.env` did **not**
fix this — Vite inlines `VITE_*` values into the public bundle.

**After:** a Node/Express backend (`/backend`) is the only thing that holds the
keys. The browser calls `POST /api/v1/analyze`; the backend fans out to the
providers server-side. **Keys never reach the browser** — verified: a grep of
the built `dist/` bundle returns zero secrets.

```
Browser ──HTTPS──▶  ReputeX backend  ──▶ Etherscan / honeypot.is / Dexscreener /
(no keys)           (holds all keys)      CoinGecko / Gemini ...
```

---

## 2. Secret management

| Item | Status |
|---|---|
| Keys removed from browser bundle | ✅ Done (verified against `dist/`) |
| Keys live only in `backend/.env` (gitignored) | ✅ Done |
| `.env` ignored in both frontend and backend `.gitignore` | ✅ Done |
| `.env.example` templates (no real values) committed | ✅ Done |
| Keys scrubbed from git history | ✅ Done previously (`git filter-repo`) |
| Unused providers removed | ✅ Alchemy, BitQuery, LunarCrush dropped — never used. Backend now uses only **4** providers (Etherscan, Moralis, CoinGecko, Gemini); honeypot.is + Dexscreener need no key. |
| **Rotate / revoke the leaked keys** | ⚠️ **STILL REQUIRED** — all were public on GitHub. Rotate the 4 still in use; **revoke** the 3 removed ones (Alchemy, BitQuery, LunarCrush) since they're no longer needed. |

> Rotation is the one outstanding must-do. Scrubbing history and moving keys
> server-side does not un-leak keys that were already public.

---

## 3. Backend hardening implemented

- **Helmet** — secure HTTP headers.
- **CORS allowlist** — only configured origins (`CORS_ORIGINS`) may call the API;
  everything else is rejected.
- **Rate limiting** — per-IP cap on `/api/v1/analyze` (each analysis fans out to
  ~7 providers, so this protects both our spend and the upstreams).
- **Input validation (zod)** — only a well-formed `0x` EVM address is accepted;
  malformed input is rejected with 400 before any provider call.
- **Tiny body cap** (16 kb) — we only accept an address; no large payloads.
- **Timeouts + bounded retries** on every outbound call; one dead provider can't
  hang or crash an analysis (graceful degradation).
- **Key-redacted logging** — URLs are logged with `apikey=***`.
- **No secret leakage in errors** — the client only ever sees a generic message;
  stack traces and provider URLs stay in the server log.
- **Env validation on boot** — server refuses to start with invalid config.
- **Graceful shutdown** on SIGINT/SIGTERM.

---

## 4. Risks that remain (prioritised)

### High
1. **Rotate the leaked keys** (see §2). Until done, treat them as public.
2. **No auth / no per-user quota on the public endpoint.** Anyone who knows the
   URL can spend your provider quota. Add API keys + per-key rate limits before
   exposing publicly (this is also the BRD's "Public API" revenue feature).
3. **CoinGecko key in a query string.** Works, but query-string secrets can leak
   via logs/proxies. Prefer header auth where the provider supports it.

### Medium
4. **In-memory cache & rate-limit state** — fine for one instance; on multiple
   instances, move both to **Redis** (the cache module is written to swap
   cleanly). Otherwise rate limits are per-instance and bypassable.
5. **No request signing / origin trust beyond CORS.** CORS is browser-enforced
   only; a script can still call the API directly. Real protection = auth + rate
   limits per principal.
6. **Honeypot/score is advisory, not a guarantee.** Add a visible disclaimer in
   the UI ("not financial advice; analysis can be wrong") to limit liability.

### Low / hygiene
7. **`npm audit`** reported vulnerabilities on the frontend; review and patch.
8. **Legacy `src/lib/api/*` modules** still exist (now unused/deprecated). Delete
   them once you've confirmed nothing else imports their helpers, to remove
   confusion and any chance of a keyless direct call.
9. **Add security headers / HTTPS at the edge** (handled by your host: Netlify,
   Fly, Render, etc.) and set `trust proxy` (already enabled in `index.ts`).

---

## 5. Production checklist

- [ ] Rotate all 7 provider keys; store in the host's secret manager (not a file).
- [ ] Put the API behind auth (API keys/JWT) + per-principal rate limits.
- [ ] Move cache + rate-limit state to Redis for multi-instance.
- [ ] Add a persistent DB for analysis history + audit log.
- [ ] Add monitoring/alerting on provider failures and latency.
- [ ] Add a "not financial advice" disclaimer in the UI.
- [ ] Pen-test the public endpoint (input fuzzing, quota abuse).
- [ ] Set strict CORS to your real frontend domain(s) only.
