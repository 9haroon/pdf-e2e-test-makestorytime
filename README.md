# Make Story Time

Interactive children’s storytelling: personalized bedtime stories with illustrations, branching choices, and a saved library.

## Repository layout

| Package | Role |
|---------|------|
| `backend/` | Express API, Prisma (PostgreSQL), Gemini integration, image storage |
| `frontend/` | Next.js App Router UI |

## Prerequisites

- Node.js 20+
- PostgreSQL (local or hosted)
- Optional: `GEMINI_API_KEY` for Google AI text/image generation (see `backend/.env.example`)

## Quick start

1. Create a database and copy environment files:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Set `DATABASE_URL` and optionally `GEMINI_API_KEY`.

2. Install dependencies and migrate:

   ```bash
   cd backend && npm install && npx prisma generate && npx prisma migrate deploy
   cd ../frontend && npm install
   ```

3. Run API and web app (two terminals):

   ```bash
   cd backend && npm run dev
   ```

   ```bash
   cd frontend && npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). The UI sends `x-session-id` (stored in `localStorage`) for library features.

API base URL defaults to `http://localhost:4000` — override with `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if needed.
