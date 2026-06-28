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

## 3. (Optional) Deploy the Telegram bot

The bot uses **long-polling**, so it needs an always-on process — a Render
**Background Worker**, which requires a **paid** plan ($7/mo). To add it, append
this to `services:` in `render.yaml`, commit, and re-sync the blueprint:

```yaml
  - type: worker
    name: reputex-bot
    runtime: node
    rootDir: backend
    plan: starter        # workers are not available on the free plan
    buildCommand: npm install && npm run build
    startCommand: npm run start:bot
    envVars:
      - key: NODE_ENV
        value: production
      - key: WEB_APP_URL
        value: https://reputex-ai.netlify.app
      - key: TELEGRAM_BOT_TOKEN
        sync: false      # paste the FULL BotFather token: <bot_id>:<secret>
      - key: ETHERSCAN_API_KEY
        sync: false
      - key: MORALIS_API_KEY
        sync: false
      - key: COINGECKO_API_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
```

> Reminder: the token currently in `.env` is malformed (missing the
> `<bot_id>:` prefix). Get the full token from @BotFather before deploying the
> bot.

If you'd rather keep the bot free, the alternative is converting it to
**webhook mode** and serving it from the API web service — ask and I'll wire
that up.
