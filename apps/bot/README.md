# Event Manager Bot

## Setup
1) Copy env:

```bash
cp .env.example .env
```

2) Fill `.env`:
- `BOT_TOKEN` (Telegram bot token)
- `DATABASE_URL` (Postgres connection string)

3) Install deps:

```bash
npm install
```

## Run

```bash
npm run dev
# or
npm start
```

## Commands
- `/start` upserts a Telegram user record
- `/ping` replies with "pong" and total Telegram users count
