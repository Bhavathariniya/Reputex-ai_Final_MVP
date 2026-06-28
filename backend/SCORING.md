# ReputeX Trust Score — Methodology

> How the score is actually computed, and why it's defensible. The whole point
> of this engine is that **every point of the score is traceable to real data
> from a named source** — no `Math.random()`, no black box.

## TL;DR

A token gets a **Trust Score from 0–100** (higher = safer). It's built from
**five weighted pillars**, each scored only from real on-chain / market data,
then constrained by **hard "veto" caps** that mirror how a human auditor thinks.
A **confidence** value (0–1) tells you how much real data backed the score.

```
Trust Score = min( weighted_average(available pillars), veto_caps )
```

## Why this replaces the old logic

The original prototype computed risk with `Math.random()` in many places:
chain detection, contract-vs-wallet detection, owner concentration, holder
counts, "liquidity locked", and the entire `analyzeTokenSecurity()` were
**fabricated**. The Gemini layer was also allowed to *overwrite* the score,
making results non-deterministic. This engine fixes both:

1. **Every signal is real** or explicitly marked unavailable.
2. **The score is deterministic.** AI only writes the human-readable narrative.

## The five pillars

| Pillar | Weight | Real data source | What it captures |
|---|---|---|---|
| **Tradability & Honeypot** | 30% | honeypot.is (live buy/sell **simulation**) | Can you actually sell? Real buy/sell tax. The most direct scam signal. |
| **Contract Security** | 25% | Etherscan (verification, source), `eth_call owner()`, source scan, contract age | Is code verified? Is ownership renounced? Mint/blacklist/pause/proxy powers? How old? |
| **Liquidity Depth** | 20% | Dexscreener | USD depth in the pool, 24h volume, pair age. Thin liquidity = easy rug. |
| **Holder Distribution** | 15% | Moralis holder stats (Etherscan Pro fallback) | Whale concentration (top-10 % of supply). Concentrated = dump risk. |
| **Market & Community** | 10% | Dexscreener + CoinGecko | Volatility, wash-trading signal, real social footprint. |

Weights sum to 1.0. Each pillar is scored 0–100 (higher = safer) and only
contributes if it has real data.

## Confidence = data coverage (honesty mechanism)

`confidence` = the sum of the weights of the pillars we actually had data for.
If we only had the honeypot check (0.30) and liquidity (0.20), confidence = 0.50.
The honeypot check is pivotal, so **if it's missing we cap confidence at 0.60**
regardless of other coverage. Missing data **lowers confidence**, it never
invents a value. This is the single most important difference from the old code.

## Veto caps (auditor overrides)

A great-looking weighted average must not rescue a token that fails a
deal-breaker. After the weighted average we apply the *lowest* applicable cap:

| Condition (real evidence) | Score capped at |
|---|---|
| Honeypot confirmed (can't sell) | **12** (Critical) |
| Sell tax ≥ 50% | 25 |
| Trade simulation failed | 45 |
| Source code **not** verified | 60 |
| Ownership not renounced **and** has mint/pause/blacklist/proxy powers | 68 |

Example: a token with a slick community and deep liquidity but a confirmed
honeypot scores **≤12**, not 70. That's the auditor mindset encoded in code.

## Verdict bands

| Score | Verdict |
|---|---|
| 80–100 | Likely Safe |
| 60–79 | Probably OK |
| 40–59 | High Caution |
| 20–39 | High Risk |
| 0–19 | Critical – Avoid |

## Worked example — USDC

USDC scores ~**68 ("Probably OK")**, not 95. Why that's *correct*, not a bug:
- ✅ Sellable, 0% tax (tradability high)
- ✅ Verified source (contract security boosted)
- ⚠️ It's an **upgradeable proxy** controlled by Circle — the source scan flags
  `proxy` and `owner()` is not renounced (genuine centralization risk)
- ✅ Holder data via Moralis: top-10 hold 27% → moderate concentration, and all
  five pillars now have data → **confidence 1.0**

A naïve "everyone knows USDC is safe → 95" hides real, defensible risk. The
engine reports what the on-chain data actually supports.

## The AI layer (explanation only)

`services/gemini.ts` receives the **already-computed** score + structured
signals and returns a plain-English narrative plus any extra red flags it spots
in the verified source. It **cannot change the number**. This keeps results
reproducible and auditable while still giving users a friendly summary.

## How to make it *more* genuine (roadmap)

1. ✅ **DONE — Holder distribution for real.** Pillar 4 now uses Moralis holder
   stats (top-10 supply % + total holders, free tier) with an Etherscan Pro
   fallback. Most tokens now get a genuine concentration score instead of
   "unavailable" (e.g. USDC top-10 = 27%, SHIB top-10 = 63%).
2. **LP lock / burn detection** — check if liquidity is locked (Unicrypt/Team.
   Finance) or LP tokens are burned. Currently we don't claim "liquidity locked".
3. **Deployer reputation** — cross-reference the creator address against a list
   of addresses that previously deployed rugs (the "previousScams" signal).
4. **Labelled dataset + calibration** — collect known scams vs blue-chips, then
   tune weights/caps against ground truth and publish a precision/recall number
   (the BRD's "95% fraud detection accuracy" claim needs this to be real).
5. **Bytecode-level analysis** for unverified contracts (selector scan, similarity
   to known-malicious bytecode) so contract security isn't blind when source is
   missing.
6. **Persist scores + track drift over time** (DB) so you can show "this token
   got riskier" and measure prediction accuracy historically.
