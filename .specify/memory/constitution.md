# Project Standards

## Code Quality

Functions must be pure where possible. No commented-out code in commits. No `any` types in TypeScript. All code reviewed before merge.

## Testing Requirements

**Strict** — unit tests + E2E for critical paths

E2E tests must cover the critical user journeys (login, checkout, primary conversion flow).

## Error Handling

User-facing errors must use plain language — never expose raw stack traces or internal IDs. All exceptions logged with full context (user_id, request_id, timestamp).

## Performance Constraints

Core pages must load in under 2 seconds on a 4G connection. Largest Contentful Paint < 2.5s. No synchronous operations on the main thread.

## UX Consistency

Follow WCAG 2.1 AA accessibility standards. Consistent use of the design system — no one-off custom styles without design review. All interactive elements have visible focus states.