<!-- Sync Impact Report
Version Change: New constitution, starting at 0.1.0.
Modified Principles: Code Quality, Testing Requirements, Error Handling, Performance Constraints, UX Consistency are now formalized under the new template structure.
Added Principles: Development Workflow, Review Process, Governance.
Removed Principles: None.
-->
# Ideva Kit Project Constitution

## Core Principles

### Code Quality
Functions must be pure where possible. No commented-out code in commits. No `any` types in TypeScript. All code reviewed before merge.

### Testing Requirements
Strict — unit tests + E2E for critical paths. E2E tests must cover the critical user journeys (login, checkout, primary conversion flow).

### Error Handling
User-facing errors must use plain language — never expose raw stack traces or internal IDs. All exceptions logged with full context (user_id, request_id, timestamp).

### Performance Constraints
Core pages must load in under 2 seconds on a 4G connection. Largest Contentful Paint < 2.5s. No synchronous operations on the main thread.

### UX Consistency
Follow WCAG 2.1 AA accessibility standards. Consistent use of the design system — no one-off custom styles without design review. All interactive elements have visible focus states.

## Development Workflow

All features follow the phased delivery plan outlined in `PLAN.md`. Code changes must adhere to the project's established conventions.

## Review Process

All code must undergo a thorough peer review before merging. Reviews should ensure compliance with this constitution and project standards.

## Governance

This constitution supersedes all other project practices. Amendments require a documented proposal, team approval, and a clear migration plan. All PRs and reviews must explicitly verify compliance with these principles.

**Version**: 0.1.0 | **Ratified**: 2026-04-25 | **Last Amended**: 2026-04-25