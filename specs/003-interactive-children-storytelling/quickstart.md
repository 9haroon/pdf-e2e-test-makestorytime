# Quickstart: Interactive Children's Storytelling

## 1) Configure environment

```bash
cp backend/.env.example backend/.env
```

Set at least:

- `DATABASE_URL`
- Optional: `GEMINI_API_KEY` for real model output

## 2) Install and initialize

```bash
cd backend && npm install && npx prisma generate
cd ../frontend && npm install
```

## 3) Start both apps

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm run dev
```

## 4) Validate the core flow

1. Open `http://localhost:3000/create`.
2. Generate a story with child name, age, and theme.
3. Pick a choice to branch the story.
4. Save to library.
5. Open `/library`, resume a story, and export PDF/text.

## 5) Run test suites

```bash
cd backend && npm test
```

```bash
cd frontend && npm run test:e2e
```
