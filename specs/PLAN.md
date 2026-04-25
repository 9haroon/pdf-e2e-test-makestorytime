# Implementation Plan: Interactive Children's Storytelling

**Branch**: `003-interactive-children-storytelling` | **Date**: 25 de abril de 2026 | **Spec**: `/specs/003-interactive-children-storytelling/spec.md`
**Input**: Feature specification from `/specs/003-interactive-children-storytelling/spec.md`

## Summary

This feature delivers an interactive web application that generates personalized bedtime stories with accompanying illustrations based on user input (child's name, age, theme). It enables dynamic story progression through user choices, saving stories to a personal library, and ensures content adherence to child-safety standards. The technical approach will involve a full-stack web application leveraging modern JavaScript/TypeScript frameworks for both frontend and backend, integrating with AI models for text and image generation, and utilizing a robust database for persistence.

## Technical Context

**Language/Version**: TypeScript (Frontend: React/Next.js, Backend: Node.js)
**Primary Dependencies**:
*   Frontend: React, Next.js, a state management library (e.g., Zustand/React Context), a UI component library (e.g., Radix UI, Shadcn UI or custom styling with Tailwind CSS).
*   Backend: Node.js, Express.js (or similar framework), an ORM (e.g., Prisma, TypeORM), Gemini API SDK for AI integration, content moderation library.
**Storage**: PostgreSQL for story metadata, user preferences, and choice paths. Cloud storage (e.g., AWS S3, Google Cloud Storage) for generated illustrations (URLs to these stored images will be saved in PostgreSQL).
**Testing**: Jest and React Testing Library for frontend unit/component tests. Jest and Supertest for backend unit/integration tests. Playwright or Cypress for E2E tests.
**Target Platform**: Web browsers (modern desktop and mobile).
**Project Type**: Full-stack Web Application.
**Performance Goals**:
*   Frontend: Core pages load in &lt;2s (4G), LCP &lt;2.5s.
*   Backend: Story/illustration generation API responses &lt;10s (allowing for AI model latency), subsequent interaction API responses &lt;500ms.
**Constraints**: Strict child-safety and age-appropriateness for all generated content; graceful handling of AI model response times and potential failures; robust error logging.
**Scale/Scope**: Initial implementation focuses on individual user stories and personal libraries. Designed for future scalability to support a growing user base and story complexity.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **I. Code Quality**:
    *   **Functions must be pure where possible**: Will enforce pure functions, especially in utility and data transformation layers.
    *   **No commented-out code in commits**: Enforced via CI/CD linting rules.
    *   **No `any` types in TypeScript**: Enforced via TypeScript configuration and linting rules (`noImplicitAny`, `explicit-any`).
    *   **All code reviewed before merge**: Enforced via PR workflow.
*   **II. Testing Requirements**:
    *   **Strict — unit tests + E2E for critical paths**: Will implement unit tests for all core components and logic. E2E tests will cover User Story 1 (Create Personalized Story) and User Story 2 (Interactive Story Navigation) as critical paths.
    *   **E2E tests must cover the critical user journeys (login, checkout, primary conversion flow)**: Create Personalized Story (core conversion) and Interactive Story Navigation will be covered by E2E tests. (Login/checkout not directly applicable for initial feature, but will be if user accounts are introduced).
*   **III. Error Handling**:
    *   **User-facing errors must use plain language**: Custom error messages for UI, avoiding raw stack traces.
    *   **All exceptions logged with full context (user_id, request_id, timestamp)**: Centralized logging service (e.g., Sentry, custom logger) will capture context for backend errors. Frontend errors will be reported via a similar mechanism.
*   **IV. Performance Constraints**:
    *   **Core pages must load in under 2 seconds on a 4G connection**: Achieved through Next.js optimization (SSR/SSG), image optimization, efficient data fetching, and minimal bundle sizes.
    *   **Largest Contentful Paint &lt; 2.5s**: Monitored and optimized through performance tooling.
    *   **No synchronous operations on the main thread**: Enforced by async patterns for data fetching and heavy computation, Web Workers where appropriate for frontend.
*   **V. UX Consistency**:
    *   **Follow WCAG 2.1 AA accessibility standards**: Accessibility audits during development and review, use of semantic HTML and ARIA attributes.
    *   **Consistent use of the design system**: Utilize a predefined UI framework or design system (e.g., a component library, Tailwind CSS with design tokens) to ensure consistency.
    *   **All interactive elements have visible focus states**: Built into the chosen UI framework or explicitly implemented via CSS.

## Project Structure

### Documentation (this feature)

```text
specs/003-interactive-children-storytelling/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/             # REST API routes and controllers
│   ├── services/        # Core business logic (story generation, image generation, moderation)
│   ├── models/          # Database models (e.g., Prisma schema definitions)
│   ├── utils/           # Shared utilities
│   └── config/          # Configuration files
└── tests/
    ├── unit/
    └── integration/

frontend/
├── src/
│   ├── app/             # Next.js App Router root
│   ├── components/      # Reusable UI components
│   ├── lib/             # Client-side utility functions, API clients
│   ├── hooks/           # React custom hooks
│   ├── styles/          # Global styles, Tailwind CSS configuration
│   └── types/           # Shared TypeScript types
└── tests/
    ├── unit/
    ├── component/
    └── e2e/
```

**Structure Decision**: Option 2: Web application (frontend + backend). This provides a clear separation of concerns, allowing independent development and deployment of the API and UI components. The `backend` directory will house Node.js services and API endpoints, while the `frontend` directory will contain the Next.js application.

## System Architecture and Major Components

1.  **Frontend (Next.js Application)**:
    *   **User Interface**: React components for story creation forms, interactive story display, choice selection, and story library management.
    *   **API Client**: Utility functions (`fetch` or Axios) to interact with the Backend API.
    *   **State Management**: Manages UI state, story progress, user input, and loading states.
    *   **Authentication/Authorization**: (Initial implicit, later explicit user accounts) Manages user sessions for saving/retrieving stories.

2.  **Backend (Node.js/Express.js API)**:
    *   **API Gateway**: Handles incoming HTTP requests from the frontend, routing to appropriate services.
    *   **Story Generation Service**: Orchestrates calls to the Text Generation AI (e.g., Gemini Pro) based on user input, constructs narrative.
    *   **Image Generation Service**: Calls Image Generation AI (e.g., Gemini Pro Vision, or a dedicated image model) to create illustrations for story scenes, manages storage (Cloud Storage).
    *   **Content Moderation Service**: Filters user input and generated AI content for child-safety compliance (FR-005).
    *   **Persistence Service**: Interacts with the PostgreSQL database for CRUD operations on `Story`, `Illustration`, and `User Library` entities.
    *   **User Management Service**: (If explicit accounts are introduced) Handles user registration, login, and profile management.

3.  **AI Models (External Integration)**:
    *   **Text Generation**: Gemini Pro (or similar LLM) for narrative text generation.
    *   **Image Generation**: Gemini Pro Vision (or similar image generation model) for scene illustrations.

4.  **Database (PostgreSQL)**:
    *   Stores `Story` metadata (ID, title, user inputs, current scene, choice history), `Illustration` URLs, and `User Library` associations.
    *   Manages user preferences (FR-006).

5.  **Cloud Storage (e.g., AWS S3, Google Cloud Storage)**:
    *   Stores generated image files (`Illustration` entities), providing public URLs for frontend display.

## Data Model and Integrations

**Entities (as defined in `spec.md`):**

*   **Story**:
    *   `id`: UUID (Primary Key)
    *   `userId`: UUID (Foreign Key to User, if applicable, otherwise device ID)
    *   `title`: String (e.g., "Max's Space Adventure")
    *   `childName`: String
    *   `childAge`: Integer
    *   `themePrompt`: String
    *   `currentSceneIndex`: Integer (to resume story)
    *   `status`: Enum ('in_progress', 'completed')
    *   `storyContent`: JSONB (Array of {text: string, illustrationId: UUID, choices: [{text: string, nextSceneIndex: int}]}) - Represents the full narrative path and decision points.
    *   `createdAt`, `updatedAt`: Timestamps
*   **Illustration**:
    *   `id`: UUID (Primary Key)
    *   `storyId`: UUID (Foreign Key to Story)
    *   `sceneIndex`: Integer (which scene it belongs to)
    *   `imageUrl`: String (URL to image in Cloud Storage)
    *   `descriptionPrompt`: String (prompt used to generate the image)
    *   `createdAt`: Timestamp
*   **User Library**:
    *   `id`: UUID (Primary Key)
    *   `userId`: UUID (Foreign Key to User)
    *   `storyId`: UUID (Foreign Key to Story)
    *   `lastReadSceneIndex`: Integer (to resume story)
    *   `addedAt`: Timestamp

**Integrations:**

*   **Database (PostgreSQL)**: Backend services will use an ORM (e.g., Prisma) to interact with PostgreSQL. Models will be defined in `backend/src/models`.
*   **Cloud Storage**: Image Generation Service will upload generated images to cloud storage and store the resulting URLs in the PostgreSQL `Illustration` table.
*   **AI APIs**: Backend services will integrate with Gemini API SDKs for text and image generation. API keys will be securely managed via environment variables.

## API Surfaces (High-Level)

All APIs will be RESTful JSON endpoints.

*   **POST `/api/stories/generate`**
    *   **Request**: `{ childName: string, childAge: number, theme: string, mood?: string }`
    *   **Response**: `{ storyId: UUID, currentScene: { text: string, illustrationUrl: string, choices: [{id: UUID, text: string}] } }`
    *   **Purpose**: Initiates a new story generation based on user input (FR-001, FR-002).

*   **POST `/api/stories/{storyId}/interact`**
    *   **Request**: `{ choiceId: UUID }`
    *   **Response**: `{ currentScene: { text: string, illustrationUrl: string, choices: [{id: UUID, text: string}] }, isCompleted: boolean }`
    *   **Purpose**: Advances the story based on a user's choice (FR-003).

*   **POST `/api/stories/{storyId}/save`**
    *   **Request**: `{ userId: UUID }` (or implicit from token)
    *   **Response**: `{ message: 'Story saved', libraryEntryId: UUID }`
    *   **Purpose**: Saves the current story to the user's library (FR-004).

*   **GET `/api/library`**
    *   **Request**: `{ userId: UUID }` (or implicit from token)
    *   **Response**: `[{ libraryEntryId: UUID, storyId: UUID, title: string, lastReadSceneIndex: number, ... }]`
    *   **Purpose**: Retrieves a list of saved stories for the user (FR-004).

*   **GET `/api/library/{libraryEntryId}/resume`**
    *   **Request**: None
    *   **Response**: `{ storyId: UUID, currentScene: { text: string, illustrationUrl: string, choices: [{id: UUID, text: string}] } }`
    *   **Purpose**: Resumes a specific story from the library (FR-004).

*   **GET `/api/stories/{storyId}/export`**
    *   **Request**: `{ format: 'pdf' | 'text' | 'images_only' }`
    *   **Response**: File download or URL to exported content.
    *   **Purpose**: Provides a shareable version of the story (FR-007).

## Phased Delivery Plan and Risks

### Phase 0: Setup &amp; Core Infrastructure (1-2 Days)
*   **Tasks**:
    *   Project initialization (Next.js app, Node.js API).
    *   Database setup (PostgreSQL schema with `Story`, `Illustration` models).
    *   Basic API framework and ORM integration.
    *   Environment configuration for AI API keys and Cloud Storage.
    *   Basic CI/CD setup for linting and unit tests.
*   **Risks**:
    *   Complexity in setting up local development environment for full-stack.
    *   Initial configuration challenges with AI SDKs.

### Phase 1: Personalized Story Generation (User Story 1 - P1) (3-4 Days)
*   **Tasks**:
    *   Implement `/api/stories/generate` endpoint.
    *   Integrate with Text Generation AI to create initial story segment.
    *   Integrate with Image Generation AI to create illustration for the first scene, upload to Cloud Storage, save URL.
    *   Frontend UI for story input (name, age, theme).
    *   Display generated story text and illustration for the first scene.
    *   Implement basic content moderation for user input.
    *   Write unit tests for generation services.
*   **Risks**:
    *   AI model response quality and coherence (may require prompt engineering).
    *   Latency of AI model calls impacting SC-001.
    *   Effective content moderation for generated text/images.

### Phase 2: Interactive Story Navigation (User Story 2 - P2) (3-4 Days)
*   **Tasks**:
    *   Enhance Story Generation Service to include decision points in the narrative structure (JSONB `storyContent`).
    *   Implement `/api/stories/{storyId}/interact` endpoint to process choices and advance the story, generating new scenes/illustrations.
    *   Frontend UI to display choices and update story view dynamically.
    *   Implement content moderation for AI-generated choices and subsequent narrative.
    *   Write E2E tests for core interactive flow.
*   **Risks**:
    *   Ensuring logical coherence and branching paths in AI-generated stories.
    *   Managing state of interactive story in the backend (e.g., tracking user choices).

### Phase 3: Save and Access Library (User Story 3 - P3) (2-3 Days)
*   **Tasks**:
    *   Implement `User Library` entity and integrate with `Story` model.
    *   Implement `/api/stories/{storyId}/save` endpoint.
    *   Implement `/api/library` and `/api/library/{libraryEntryId}/resume` endpoints.
    *   Frontend UI for "Save to Library" action and displaying the user's library.
    *   Implement basic persistence for user preferences (FR-006).
    *   Write unit tests for library services.
*   **Risks**:
    *   Managing user identity (device-based vs. explicit accounts).
    *   Data storage limits if stories are very large or numerous.

### Phase 4: Refinement, Moderation &amp; Export (2-3 Days)
*   **Tasks**:
    *   Implement `FR-005` clarification: Define specific content filtering guidelines and integrate a more robust moderation system (e.g., custom rules, third-party API).
    *   Implement `FR-007` (Export Story): Implement `/api/stories/{storyId}/export` for PDF/text output.
    *   Performance tuning (frontend and backend).
    *   Accessibility audit and fixes.
    *   Comprehensive error handling and logging (SC-004).
    *   Final E2E testing and QA.
*   **Risks**:
    *   Accuracy and false positives/negatives in content moderation.
    *   Complexity of generating various export formats (e.g., PDF generation).

---