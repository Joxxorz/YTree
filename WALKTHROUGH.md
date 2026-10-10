# Walkthrough and submission preparation

## Five-minute demonstration

1. Start from seed data: Barclays Uploaded, HSBC Missing, Vanguard Outdated. Show the ready count and displayed cutoff.
2. Filter Missing. Explain that the list changes but readiness still includes every selected provider.
3. Add Aviva and Fidelity together. Show that selected providers cannot be chosen again. Remove Fidelity.
4. Enter a filename and today's statement date for HSBC, replace Vanguard's old statement, and upload Aviva's statement.
5. Submit the complete set and show the receipt. Explain that direct API submission of an incomplete set receives 422.

## Questions to reason through

- **Why does freshness live on the server?** The server controls acceptance and the clock. Returning calculated statuses avoids conflicting frontend rules; the screen still gives immediate guidance.
- **How are duplicates prevented?** The picker excludes membership, but an atomic backend check enforces it regardless of the UI. Test the failure of a batch containing an existing provider.
- **Why three months rather than 90 days?** Calendar months differ in length. Show the fixed-clock month-end test and explain the inclusive boundary.
- **Why this state model?** Server snapshots are confirmed state; forms/picker/filter are temporary UI state. Failed calls preserve both rather than optimistically clearing them.
- **Why these HTTP codes?** Distinguish input validity, missing resources, duplicate conflicts and incomplete business state. Returning snapshots trades a small payload for less client complexity.
- **What tests carry the most value?** Date boundaries and submission rejection protect advice readiness; the browser test proves the two halves integrate. Component mocks alone cannot establish that.
- **What changes in production?** Durable per-client storage, authorization, idempotent submission and explicit lifecycle semantics first; real secure upload processing only when in scope.
- **What did AI do?** Describe the actual generated implementation and verification in NOTES.md. Explain which proposals you reviewed, understood and adopted; do not claim authorship or review that did not happen.

## Before sending

Read the implementation and notes, run README's checks, and make any edits needed to reflect your own judgement. Confirm the recruiter can access the GitHub repository; successful Git push does not establish recruiter access to a private repository.

## Suggested email (review and send yourself)

Hi Majid,

I've completed the Connect your accounts assessment. The implementation, setup instructions and engineering notes are available here:

https://github.com/Joxxorz/YTree

It uses React/TypeScript and Java/Spring Boot, with tests for statement freshness, account management and submission validation. NOTES.md documents the decisions, limitations and AI-assisted workflow.

I'm looking forward to walking through it with Alex.

Best,
[Your name]
