# Habit Atlas

Habit Atlas is a production-ready habit tracker with deep analytics, offline-first check-ins, and a built-in coaching assistant. It runs locally with Docker Compose, using a single Node.js app container and a Postgres database.

## Features

- Advanced habit modeling (build/quit, schedules, binary/quantitative/timed targets)
- Daily check-in timeline with offline queue + sync
- Analytics dashboards (completion rates, streaks, heatmaps, correlations)
- Local GenAI coach (rule-based) with privacy mode
- Email/password authentication with session cookies + CSRF protection
- Responsive UI for mobile/tablet/desktop/TV layouts
- CSV and JSON export
- Seed data for quick evaluation

## Prerequisites

- Docker + Docker Compose
- Node.js 20+ (for local development without Docker)

## Local Run (Docker)

```bash
docker compose up --build
```

The app will be available at `http://localhost:5173`.

### Demo Account

- Email: `demo@habitatlas.app`
- Password: `password123`

## Local Development (without Docker)

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

Vite runs on `http://localhost:5173` and the API on `http://localhost:5174`.

## Database Migrations

```bash
npm run migrate
```

## Seed Data

```bash
npm run seed
```

## Tests

```bash
npm run test
```

## Optional OpenAI Integration

The coach defaults to local heuristics. To enable external LLM calls later:

1. Set `ENABLE_OPENAI=true` and `OPENAI_API_KEY=your-key` in the environment.
2. Toggle “Enable OpenAI coach” in Settings.

Privacy mode must be disabled before any external calls (default is enabled).

## Project Structure

```
client/          # React + Vite + Tailwind UI
server/          # Express API and services
tests/           # Unit + API tests
```

## Scripts

- `npm run dev` – run Vite + API
- `npm run build` – build the frontend
- `npm run start` – run the API server in production mode
- `npm run migrate` – run SQL migrations
- `npm run seed` – load sample data
- `npm run test` – run unit + API tests
