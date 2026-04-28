---

description: "Task list for Interactive Children's Storytelling implementation"
---

# Tasks: Interactive Children's Storytelling

**Input**: Design documents from `/specs/003-interactive-children-storytelling/`

**Prerequisites**: plan.md ✓, spec.md ✓

**Tests**: Optional task phases below — constitution-level unit and E2E coverage appear in **Phase 7 (Polish)**. Write failing tests first if you adopt TDD locally.

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no hard dependency on incomplete sibling tasks in the same wave)
- **[Story]**: `[US1]`–`[US3]` only on user-story phases; omitted on Setup, Foundational, and Polish
- Every description names target file(s)

## Path Conventions (from plan.md)

- **Backend**: `backend/src/` — API, services, Prisma, middleware, utils
- **Frontend**: `frontend/src/` — Next.js App Router, components, lib, hooks, types

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo-style layout with Next.js frontend and Express API per implementation plan.

- [X] T001 Create `backend/` and `frontend/` directory layout and add repository root `README.md` documenting how to run API and web app locally
- [X] T002 Initialize Node.js + TypeScript backend with Express, Prisma, and dotenv dependencies in `backend/package.json`
- [X] T003 Scaffold Next.js (App Router) TypeScript app with Tailwind in `frontend/package.json`, `frontend/next.config.ts`, and `frontend/src/app/layout.tsx`
- [X] T004 [P] Configure ESLint for the backend in `backend/eslint.config.mjs` (or `eslint.config.js`)
- [X] T005 [P] Configure ESLint for the frontend in `frontend/eslint.config.mjs` (extend Next.js defaults)
- [X] T006 [P] Add Prettier configuration at repository root `.prettierrc` (or `.prettierrc.json`) and align with both packages
- [X] T007 Document required environment variables in `backend/.env.example` (`DATABASE_URL`, Gemini API keys, optional cloud storage bucket/credentials)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, HTTP server, cross-cutting logging/errors, AI and storage integrations used by every user story.

**⚠️ CRITICAL**: No user story work should merge until this phase is complete.

- [X] T008 Define Prisma schema for `Story` and `Illustration` entities (including `storyContent` JSON as in plan.md) in `backend/prisma/schema.prisma`
- [ ] T009 Generate Prisma client and apply initial migration from `backend/prisma/schema.prisma` using `backend/prisma/migrations/`
- [X] T010 Implement Express application bootstrap and listen in `backend/src/api/server.ts`
- [X] T011 [P] Implement structured logger with `request_id` correlation in `backend/src/utils/logger.ts`
- [X] T012 [P] Implement centralized JSON error handler with user-safe messages (no stack traces to clients) in `backend/src/api/middleware/error-handler.ts`
- [X] T013 Mount placeholder API routing in `backend/src/api/routes/index.ts` (health check route allowed)
- [X] T014 [P] Implement content moderation stub that can be tightened later (FR-005) in `backend/src/services/moderation-service.ts`
- [X] T015 [P] Implement Gemini (or configured) **text** generation client in `backend/src/services/gemini-text-service.ts`
- [X] T016 [P] Implement configured **image** generation client in `backend/src/services/gemini-image-service.ts`
- [X] T017 Implement upload of generated images to cloud storage and return public/signed URLs in `backend/src/services/image-storage-service.ts`

**Checkpoint**: Database, API shell, AI, storage, logging, and safe errors are ready for feature routes.

---

## Phase 3: User Story 1 — Create Personalized Story (Priority: P1) 🎯 MVP

**Goal**: User submits child name, age, and theme; API returns coherent first scene text plus illustration; UI can request a new variation with the same inputs (spec acceptance scenario 2).

**Independent Test**: Submit parameters (e.g. `"Max"`, `5`, `"space adventure"`) and verify coherent narrative plus opening illustration URL; trigger regenerate and verify a distinct variation.

**Maps to**: FR-001, FR-002; SC-001 (latency target is a tuning goal for this phase).

### Implementation for User Story 1

- [X] T018 [US1] Implement `StoryGenerationService` (orchestrates moderation → text → image → DB) in `backend/src/services/story-generation-service.ts`
- [X] T019 [US1] Implement `POST /api/stories/generate` in `backend/src/api/routes/stories.ts`
- [X] T020 [US1] Register `stories` routes under `/api` in `backend/src/api/routes/index.ts`
- [X] T021 [P] [US1] Add typed `postGenerate` client in `frontend/src/lib/api/stories.ts`
- [X] T022 [P] [US1] Build story creation form page in `frontend/src/app/create/page.tsx`
- [X] T023 [US1] Build `StoryScene` viewer (text + image + loading states) in `frontend/src/components/story/StoryScene.tsx`
- [X] T024 [US1] Add “new version” / regenerate control on `frontend/src/app/create/page.tsx` that calls generate again with the same inputs

**Checkpoint**: US1 works end-to-end without branching or library.

---

## Phase 4: User Story 2 — Interactive Story Navigation (Priority: P2)

**Goal**: Narrative exposes at least two decision points (FR-003); user selects choices; subsequent scenes and illustrations update coherently.

**Independent Test**: Start a story, reach a branch, choose an option, confirm updated text and illustration reflect the choice path.

**Maps to**: FR-003.

### Implementation for User Story 2

- [X] T025 [US2] Extend generation/persistence so `storyContent` includes **≥2** decision points with choices (update prompts and schema usage) in `backend/src/services/story-generation-service.ts`
- [X] T026 [US2] Implement `StoryInteractionService` (apply choice, advance scene, optionally generate next illustration) in `backend/src/services/story-interaction-service.ts`
- [X] T027 [US2] Implement `POST /api/stories/:storyId/interact` in `backend/src/api/routes/stories.ts`
- [X] T028 [P] [US2] Build `StoryChoices` UI in `frontend/src/components/story/StoryChoices.tsx`
- [X] T029 [US2] Wire interact API, scene navigation state, and choice UI across `frontend/src/lib/api/stories.ts`, `frontend/src/components/story/StoryScene.tsx`, and `frontend/src/app/story/[storyId]/page.tsx`

**Checkpoint**: Interactive branching works on top of US1.

---

## Phase 5: User Story 3 — Save and Access Library (Priority: P3)

**Goal**: Save in-progress/completed stories to a personal library; list saved stories; resume from last read position (FR-004, FR-006 persistence baseline).

**Independent Test**: Generate a story, save it, open library list, resume from last scene index.

**Maps to**: FR-004, FR-006 (minimal device/session identity acceptable until product clarifies accounts).

### Implementation for User Story 3

- [X] T030 [US3] Extend Prisma schema with identity + library models (e.g. `User` or `AnonymousSession`, `LibraryEntry`) and migrate in `backend/prisma/schema.prisma`
- [X] T031 [US3] Implement library persistence and resume logic in `backend/src/services/library-service.ts`
- [X] T032 [US3] Implement `POST /api/stories/:storyId/save`, `GET /api/library`, and `GET /api/library/:libraryEntryId/resume` in `backend/src/api/routes/library.ts`
- [X] T033 [US3] Mount library routes in `backend/src/api/routes/index.ts`
- [X] T034 [P] [US3] Add library and resume API helpers in `frontend/src/lib/api/library.ts`
- [X] T035 [US3] Add `SaveToLibrary` action component in `frontend/src/components/story/SaveToLibraryButton.tsx` and integrate on the story view
- [X] T036 [US3] Build library list page in `frontend/src/app/library/page.tsx`
- [X] T037 [US3] Build resume flow page in `frontend/src/app/library/[entryId]/page.tsx` (or equivalent dynamic segment)
- [X] T038 [US3] Persist default child/name preferences across sessions (API or client strategy per FR-006) in `backend/src/api/routes/preferences.ts` and `frontend/src/lib/preferences.ts`

**Checkpoint**: Library and basic preferences work; US3 independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: FR-007 export, moderation hardening, constitution-level testing and UX/performance.

- [X] T039 [P] Implement `GET /api/stories/:storyId/export` with supported `format` query (`pdf` | `text` | `images_only` per plan) in `backend/src/api/routes/stories.ts`
- [X] T040 [P] Add export/download entry point in `frontend/src/components/story/StoryExport.tsx`
- [X] T041 Align moderation and logging with child-safety requirements (FR-005, SC-004) in `backend/src/services/moderation-service.ts` and audit log points in `backend/src/utils/logger.ts`
- [X] T042 [P] Add Playwright E2E covering create story + at least one branch interaction in `frontend/tests/e2e/story-journey.spec.ts`
- [X] T043 [P] Add Jest unit tests for story generation orchestration in `backend/tests/unit/story-generation-service.test.ts`
- [ ] T044 Verify LCP/core Web Vitals and keyboard focus visibility on interactive elements under `frontend/src/components/` and `frontend/src/app/`
- [X] T045 Author local developer **quickstart** in `specs/003-interactive-children-storytelling/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately — no prerequisites
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 and **US1** route/data structures for stories (sequential recommendation: complete US1 first)
- **Phase 5 (US3)**: Depends on Phase 2 and functional story persistence from US1/US2
- **Phase 6 (Polish)**: Depends on completion of desired user stories (typically US1–US3)

### User Story Dependencies

| Story | Depends on |
|-------|------------|
| US1 | Foundational only |
| US2 | Foundational + US1 (shared story session model) |
| US3 | Foundational + persisted stories from US1/US2 |

### Within Each User Story

Models/services before routes; backend routes before frontend wiring unless using mocked API; components can parallelize when marked `[P]`.

### Parallel Opportunities

- **Phase 1**: T004, T005, T006 in parallel
- **Phase 2**: T011, T012, T014, T015, T016 in parallel once T008–T010 scaffolding exists
- **Phase 3**: T021 and T022 parallel after T019–T020
- **Phase 4**: T028 parallel while backend T025–T027 proceed if coordinated
- **Phase 5**: T034 parallel with backend library tasks after T032 exists
- **Phase 6**: T039, T040, T042, T043 in parallel waves

---

## Parallel Example: User Story 1

```bash
# After T020 completes:
pnpm --filter frontend dev   # manual
# In parallel agents:
Task T021 → frontend/src/lib/api/stories.ts
Task T022 → frontend/src/app/create/page.tsx
# Then T023 serializes on integration points with T021–T022
```

---

## Parallel Example: User Story 2

```bash
# Backend chain: T025 → T026 → T027
# Frontend can start T028 once choice shape is stable from T025–T026
Task T028 → frontend/src/components/story/StoryChoices.tsx
Task T029 → wires components + API after T027
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. **STOP**: Validate independent test for US1 (generate + illustrate + regenerate)
4. Demo or deploy MVP

### Incremental Delivery

1. Setup + Foundational → stable API layer
2. Add US1 → validate → ship MVP
3. Add US2 → validate branching E2E
4. Add US3 → validate library + resume
5. Run Phase 6 for export, moderation hardening, and regression tests

### Parallel Team Strategy

After Phase 2: one developer on backend story services, another on frontend pages — synchronize on shared types in `backend` responses and `frontend/src/lib/types/` if introduced.

---

## Notes

- Clarifications in spec (FR-005, FR-006, FR-007) should be resolved before locking production moderation and export formats; tasks above allow iterative tightening (especially T041, T039–T040).
- Constitution performance (e.g. LCP &lt; 2.5s) is explicitly addressed in T044.
- Avoid `[P]` on tasks that edit the same file in the same phase without coordination.
