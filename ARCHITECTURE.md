# InmoLawyer Architecture

## System Overview

InmoLawyer is a static frontend backed by Supabase and n8n:

- `app.html` loads the authenticated application UI.
- `app.js` handles upload, analysis polling, chat, payments, admin views, and PDF generation.
- `auth.js` handles Supabase auth, profile loading, and account flows.
- Supabase provides Auth, PostgreSQL tables, and edge functions.
- n8n workflows perform contract analysis, legal chat, and related backend automations.

## Main Runtime Flows

### Contract Analysis

1. The browser uploads a contract to the analysis endpoint.
2. The backend returns a `job_id`.
3. The frontend polls the status endpoint until the analysis completes.
4. The UI renders extracted data, alerts, dates, debtors, and downloadable PDF output.

### Legal Chat

1. The browser sends `contratoId`, `pregunta`, and `user_id`.
2. n8n builds contract context and calls the LLM.
3. The workflow stores the question/answer and returns a JSON response.
4. The frontend renders the assistant response in the chat panel.

### Payments

1. The frontend requests a Wompi integrity signature from a Supabase function.
2. The browser redirects to Wompi Checkout.
3. Wompi redirects back to `app.html`.
4. The frontend reloads the user profile and confirms credits were actually applied before showing payment success.

## Corrective Changes

### 2026-03-24

- Frontend rendering paths were hardened in `app.js` so dynamic contract, chat, admin, and history content is escaped before insertion into the DOM.
- Chat response handling now accepts `respuesta`, `response`, `text`, or `mensaje`, and treats an empty successful HTTP response as an application error.
- The Wompi return flow now stores pending purchase context in session storage and confirms credits via refreshed Supabase profile data instead of trusting URL params alone.
- The checked-in n8n workflow exports were aligned so stored and returned chat payloads also fall back to `output` when needed.
- Static asset cache keys in `app.html` were bumped to force clients to fetch the updated JS on deploy.

## Known Gaps

- Payment confirmation is still indirect: the frontend verifies applied credits, not Wompi transaction state. A dedicated backend verification endpoint remains the stronger long-term design.
- Browser E2E coverage is still missing for upload, chat, admin rendering, and payment return paths.
