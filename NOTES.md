# Engineering notes

## Scope and architecture

The product brief explicitly asks for React/TypeScript and Java or Kotlin/Spring Boot. I chose Java 21, Spring Boot, and an in-memory service. The pasted planning notes suggested Node/Express, but that would not meet the actual assessment. There is one client and no real file handling, sign-in, database or deployment machinery.

The backend owns provider membership, date validation, freshness and submission readiness. The frontend renders the server's snapshot rather than maintaining a second version of those rules. A typed API module keeps HTTP details out of components. React state handles fetched data, the current filter, picker selection and statement drafts; adding a global state library would not solve a problem here.

The provider picker, statement form and screen are separate components. Straightforward CSS keeps the dependency footprint small. Mutation buttons are disabled while requests run. Failed mutations leave the last confirmed snapshot and draft intact. A failed submit does not clear anything. Background refresh updates freshness when the tab returns or the date changes; failed refreshes preserve the last successful snapshot. That snapshot can become stale if the service is unavailable, but submit always validates against the current server clock.

## API

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/providers` | Full independent catalogue |
| GET | `/api/accounts` | Accounts, statuses, ready count, readiness, today and cutoff |
| POST | `/api/accounts` | Add `{providerIds: [...]}` atomically; 201 snapshot |
| DELETE | `/api/accounts/{id}` | Remove selected provider; 200 snapshot |
| PUT | `/api/accounts/{id}/statement` | Replace `{filename, date}` metadata; 200 snapshot |
| POST | `/api/submissions` | Validate entire set; 201 receipt |

400 means invalid input; 404 unknown/unselected provider; 409 duplicate membership; 422 an empty/incomplete submission. Expected errors have a consistent `{message}` body. Returning a complete snapshot after account mutations keeps the client simple and makes readiness immediately authoritative. The catalogue deliberately remains independent; the UI hides selected entries and the backend rejects duplicates even when called directly.

Batch add validates every requested ID before modifying state. Invalid uploads validate before replacing the previous statement. Service methods are synchronized because the shared in-memory map can be reached by concurrent requests; validation and mutation happen together.

## Calendar dates and validation

Dates are ISO `YYYY-MM-DD`, parsed strictly on the backend. Future dates are rejected. A filename is trimmed, nonblank and limited to 200 characters; no extension restriction is invented because no actual file is transferred.

Freshness means `statementDate >= today.minusMonths(3)`, with a UTC server clock. The boundary is inclusive. Java calendar subtraction clamps month ends: 31 May 2026 minus three months is 28 February 2026. This is a calendar-month rule, not a 90-day duration. `Clock` is injected so seed data stays useful and tests remain deterministic. UI date constraints improve feedback; the backend remains authoritative.

## Verification

Service tests cover missing statements, inclusive cutoff, just-before cutoff, month ends, leap years/year rollover, duplicate batches and atomic failure, add/remove/re-add, invalid/future uploads preserving data, empty/incomplete submission preserving data, and valid replacement/submission. MockMvc tests exercise HTTP validation/status codes independently of the screen. React tests cover readiness/filtering, batch selection and exclusion, draft preservation, failed submission/retry, empty state and load/retry. A Playwright test uses the real API for the complete submission journey and checks narrow-screen overflow.

No test coverage percentage target was used. The checks protect business invariants and the user journey. See README for commands; verification results are reported separately rather than claiming that documentation proves they ran.

## Trade-offs and next steps

In-memory state is deliberate and not durable. Submitting issues a receipt but does not lock accounts or persist an advice workflow; those semantics are not specified. Repeated successful submits produce separate receipts. A real workflow would need persistence, client identity, authorization, idempotency, concurrency/version handling and explicit submission lifecycle semantics. Real statement processing would also require secure upload storage and scanning; it is intentionally outside this brief.

With more time I would add focused accessibility automation, more API schema validation, test delayed/network-interrupted responses, and clarify business timezone and submission lifecycle with product. No elaborate abstractions or infrastructure were added for hypothetical scale.

## AI usage and review ownership

Codex inspected the brief and planning notes, generated the initial implementation, tests and documentation, and ran the available build/test/browser checks. It also diagnosed cloud-specific Java compiler and Maven proxy setup. The product brief determined the stack and scope; Codex proposed the inclusive calendar boundary, API structure and component separation.

These are AI-assisted implementation decisions, not claims that the candidate personally authored or reviewed every line. Before submitting, the candidate should review the changes, run the documented checks locally and be able to explain the decisions below. Human ownership means accepting or changing the design after that review. This record deliberately avoids attributing unperformed human review or work to the candidate.

## Optional hosted review

At the user's request, deployment configuration was added after the assessment implementation: Vercel for the static React build and Render for the Java service. The frontend accepts a public API origin at build time; the backend accepts an explicit list of browser origins and the host's port. Local development remains unchanged. This does not add durable storage or authentication: public visitors share one demo state, and the service resets on restart. Codex prepared the hosting files and instructions; an actual hosted deployment must be checked separately.
