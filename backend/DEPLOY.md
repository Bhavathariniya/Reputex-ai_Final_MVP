# Deploying the ReputeX backend to Render

The frontend stays on **Netlify** (static SPA). The backend (Express API +
optional Telegram bot) runs on **Render**. They talk over HTTPS, so two things
must line up: the frontend must know the API URL, and the API must allow the
frontend's origin via CORS.

---

## 1. Deploy the API (free web service)

1. Push this repo to GitHub (already done).
2. Go to **https://dashboard.render.com → New → Blueprint**.
3. Connect the repo. Render detects `backend/render.yaml` and shows a
   **`reputex-api`** web service.
4. When prompted, paste the secret env vars (the ones marked `sync: false`):
   - `ETHERSCAN_API_KEY`
   - `MORALIS_API_KEY`
   - `COINGECKO_API_KEY`
   - `GEMINI_API_KEY`
   (Copy them from your local `backend/.env`.)
5. Click **Apply**. First build takes ~2–3 min. You'll get a URL like
   `https://reputex-api.onrender.com`.
6. Verify it's live: open `https://reputex-api.onrender.com/health` — you should
   see `{"status":"ok",...}`.

> **Free-tier note:** the service sleeps after ~15 min idle and cold-starts
> (~50s) on the next request. Fine for a demo/MVP. Upgrade to the Starter plan
> ($7/mo) to keep it always-on.

---

## 2. Point the frontend at the API

In **Netlify → Site settings → Environment variables**, set:

```
VITE_API_BASE_URL = https://reputex-api.onrender.com
```

Then **trigger a redeploy** (Netlify → Deploys → Trigger deploy). Vite only
reads env vars at build time, so the redeploy is required.

Make sure the API's `CORS_ORIGINS` (in `render.yaml` / Render env) exactly
matches your Netlify origin, e.g. `https://reputex-ai.netlify.app`. If you use a
custom domain, add it comma-separated:
`https://reputex-ai.netlify.app,https://app.reputex.ai`.

---

## 3. Telegram bot (webhook mode — free, no extra service)

The bot runs in **webhook mode from the same API web service**, so there's no
separate process to pay for. It activates automatically at startup when a valid
token is present, using Render's injected `RENDER_EXTERNAL_URL` as the public
webhook URL.

To enable it:

1. In the Render dashboard for `reputex-api`, set the secret env var
   **`TELEGRAM_BOT_TOKEN`** to the **FULL** token from @BotFather
   (`<bot_id>:<secret>`, e.g. `8012345678:AA...`).
   > The token currently in your local `.env` is malformed — it's missing the
   > `<bot_id>:` prefix. Get the complete token from @BotFather (`/mybots` →
   > API Token) first.
2. Save and let the service redeploy. On boot the logs show
   `telegram_webhook_set` with the URL, and the bot is live.
3. Message your bot on Telegram and paste a token address to test.

How it works (for reference):
- `POST /telegram/webhook` receives updates (grammY `webhookCallback`).
- The route is protected by a secret token header (auto-derived from the bot
  token, or set `TELEGRAM_WEBHOOK_SECRET` to override).
- If `TELEGRAM_BOT_TOKEN` is blank, the webhook is simply not mounted and the
  API runs normally without the bot.

> **Free-tier caveat:** while the web service is asleep, the first Telegram
> message wakes it (cold start ~50s), so the very first reply after idle is
> slow. Telegram retries delivery, so messages aren't lost. Upgrade to Starter
> to keep it always-on.

**Local testing** still uses long-polling — run `npm run bot` (no public URL
needed). Webhook mode only engages when `PUBLIC_API_URL` / `RENDER_EXTERNAL_URL`
is set.
