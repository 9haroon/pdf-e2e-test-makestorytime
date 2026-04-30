```markdown
# AGENT.md - AI Coding Assistant Guide

This document outlines the conventions, architecture, and requirements for AI coding assistants contributing to this repository. Adherence to these guidelines ensures code quality, consistency, and alignment with project goals.

## Project Overview
This project delivers an interactive web application for children's storytelling. It generates personalized bedtime stories with accompanying illustrations based on user input, allowing dynamic story progression through choices and saving to a personal library, while ensuring strict child-safety standards.

## Tech Stack
*   **Languages**: TypeScript
*   **Frameworks**: React, Next.js (Frontend); Node.js, Express.js (Backend)
*   **Databases**: PostgreSQL
*   **Major Libraries**: Gemini API SDK, Radix UI/Shadcn UI/Tailwind CSS (UI), Prisma/TypeORM (ORM), Jest, React Testing Library, Supertest, Playwright/Cypress (Testing).

## Repository Structure
*   `backend/`: Node.js API, services, models, configuration.
*   `frontend/`: Next.js application, including UI components, client-side utilities, and styles.
*   `specs/`: Feature specifications, plans, and other documentation.
*   `.github/workflows/`: CI/CD configuration.

## Architecture Decisions
*   **Full-Stack Application**: A hybrid architecture employing a Next.js frontend and a Node.js/Express.js backend for a cohesive user experience and robust API.
*   **AI-Powered Content Generation**: Leverages Gemini API for dynamic text and illustration generation, enabling personalized stories.
*   **Data Storage Strategy**: PostgreSQL for structured metadata and user data, with Cloud Storage (e.g., S3, GCS) for hosting generated image assets.
*   **Phased Feature Delivery**: Development follows a structured, phased approach as outlined in `PLAN.md`, ensuring manageable iteration and risk mitigation.
*   **Strict Constitution Adherence**: All architectural and implementation decisions are subordinate to the core principles outlined in `CONSTITUTION.md`.
*   **Content Moderation First**: Integrated content moderation is a critical component for ensuring child-safety and age-appropriateness.

## Coding Conventions
*   **Function Purity**: Prioritize pure functions for predictability and testability, especially in utility and data transformation layers.
*   **Type Safety**: Strict adherence to TypeScript, prohibiting `any` types to ensure robust type checking.
*   **Clean Commits**: No commented-out code should be committed.
*   **Design System Consistency**: Utilize a predefined UI framework or design system for all frontend development to maintain visual and interactive consistency.
*   **Accessibility Standards**: Development must comply with WCAG 2.1 AA accessibility standards.
*   **Focus States**: All interactive elements must have clearly visible focus states.

## Testing Requirements
*   **Comprehensive Testing**: Mandates strict unit testing for all core components and logic, complemented by End-to-End (E2E) tests for critical user journeys.
*   **Critical Path Coverage**: E2E tests must specifically cover the primary conversion flows: "Create Personalized Story" and "Interactive Story Navigation".
*   **CI/CD Enforcement**: Testing procedures are integrated into the CI/CD pipeline to ensure ongoing quality and compliance.

## Key Rules
*   Never commit secrets or API keys.
*   All code must undergo peer review before merging.
*   No commented-out code is permitted in commits.
*   The TypeScript `any` type is strictly forbidden.
*   User-facing errors must be presented in plain language, avoiding internal technical details.
*   All caught exceptions must be logged with full context (user ID, request ID, timestamp).
*   Generated content (text and illustrations) must strictly adhere to child-safety and age-appropriateness guidelines.
*   Development must comply with WCAG 2.1 AA accessibility standards.
*   All interactive UI elements must have visible focus states.
```