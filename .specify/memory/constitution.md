```html

```
# Ideva Kit Project Constitution

## Core Principles

### I. Code Quality
Functions must be pure where possible. No commented-out code in commits. No `any` types in TypeScript. All code reviewed before merge.

### II. Testing Requirements
Strict — unit tests + E2E for critical paths. E2E tests must cover the critical user journeys (login, checkout, primary conversion flow).

### III. Error Handling
User-facing errors must use plain language — never expose raw stack traces or internal IDs. All exceptions logged with full context (user_id, request_id, timestamp).

### IV. Performance Constraints
Core pages must load in under 2 seconds on a 4G connection. Largest Contentful Paint &lt; 2.5s. No synchronous operations on the main thread.

### V. UX Consistency
Follow WCAG 2.1 AA accessibility standards. Consistent use of the design system — no one-off custom styles without design review. All interactive elements have visible focus states.

## Development Workflow

All features follow the phased delivery plan outlined in `PLAN.md`. Code changes must adhere to the project's established conventions.

## Review Process

All code must undergo a thorough peer review before merging. Reviews should ensure compliance with this constitution and project standards.

## Governance

This constitution supersedes all other project practices. Amendments require a documented proposal, team approval, and a clear migration plan. All PRs and reviews must explicitly verify compliance with these principles.

**Version**: 0.1.1 | **Ratified**: 2026-04-25 | **Last Amended**: 2026-04-25

I will now write this content to the `specs/CONSTITUTION.md` file.

# Ideva Kit Project Constitution

## Core Principles

### I. Code Quality
Functions must be pure where possible. No commented-out code in commits. No `any` types in TypeScript. All code reviewed before merge.

### II. Testing Requirements
Strict — unit tests + E2E for critical paths. E2E tests must cover the critical user journeys (login, checkout, primary conversion flow).

### III. Error Handling
User-facing errors must use plain language — never expose raw stack traces or internal IDs. All exceptions logged with full context (user_id, request_id, timestamp).

### IV. Performance Constraints
Core pages must load in under 2 seconds on a 4G connection. Largest Contentful Paint &lt; 2.5s. No synchronous operations on the main thread.

### V. UX Consistency
Follow WCAG 2.1 AA accessibility standards. Consistent use of the design system — no one-off custom styles without design review. All interactive elements have visible focus states.

## Development Workflow

All features follow the phased delivery plan outlined in `PLAN.md`. Code changes must adhere to the project's established conventions.

## Review Process

All code must undergo a thorough peer review before merging. Reviews should ensure compliance with this constitution and project standards.

## Governance

This constitution supersedes all other project practices. Amendments require a documented proposal, team approval, and a clear migration plan. All PRs and reviews must explicitly verify compliance with these principles.

**Version**: 0.1.1 | **Ratified**: 2026-04-25 | **Last Amended**: 2026-04-25