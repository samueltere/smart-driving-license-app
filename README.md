# Hossana Driving License Services

Full-stack app (React + Express + SQLite) for registration, OTP verification, license updates, and admin workflows.

## Local Run

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - copy `.env.example` to `.env`
   - fill SMTP values
3. Start app:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Render Deployment (Persistent Database)

This project includes [`render.yaml`](./render.yaml) for one-click setup.

1. Push this repo to GitHub.
2. In Render, create **New > Blueprint** and select this repo.
3. Render will create:
   - a Node web service
   - a persistent disk mounted at `/var/data`
4. Set required environment variables in Render:
   - `APP_URL` (your Render URL, e.g. `https://your-service.onrender.com`)
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

Important:
- Database file is stored at `/var/data/hossana_driving.db` (persistent).
- Uploaded files are stored at `/var/data/uploads` (persistent).

## Why Vercel Fails for Persistence

Vercel serverless runtime uses ephemeral filesystem. SQLite and uploaded files are not reliably persistent across requests, so registration/admin data can disappear.
