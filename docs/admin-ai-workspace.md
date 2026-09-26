# Admin AI Workspace

Local URL: http://localhost:3012/admin/ai

Entry points: Admin dashboard -> Open AI Workspace; request detail -> Ask AI about this request; generated brief panel -> Ask AI to improve this brief.

Select a request or customer on the left, review its context, then use a quick action or type a question. Confirm data sharing and press Send. Quick actions only fill the composer; opening a page does not call OpenAI. Answers are labelled drafts. Copy buttons have a manual text-selection fallback.

History is stored in PostgreSQL, tied to a hash of the validated admin session plus optional request ID/customer slug. A conversation URL is private to the same signed-in session; signing out or session expiry removes access, not the stored audit data. The latest 16 completed messages and a bounded context snapshot are supplied on each turn. Dedicated phone/email fields are excluded; descriptions may contain personal data and require review.

No answer is automatically added to a brief. Applying free-form chat to a structured or approved brief is deliberately omitted. Use the existing brief review/build approval workflow; copy reviewed material for manual editing.

## Migration and configuration

Migration: db/migrations/0004_webfactory_ai_chat.sql.
Run npm run webfactory:migrate. Adds webfactory.ai_conversations and webfactory.ai_messages only; includes session/history indexes, turn uniqueness and one-pending-turn constraint.

Existing server-only variables: OPENAI_API_KEY, LEADS_DATABASE_URL, WEBFACTORY_ADMIN_USER, WEBFACTORY_ADMIN_PASSWORD, WEBFACTORY_SESSION_SECRET. Optional WEBFACTORY_AI_MODEL (existing default gpt-4.1-mini). No NEXT_PUBLIC key and no new provider dependency.

Keep WEBFACTORY_CUSTOMER_EMAILS_ENABLED=false and WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED=false. Payments remain manual-only and customer lookup remains inactive. No new email, payment, file-system, deployment or browsing tools are exposed to AI.

## Safety and verification

POST /api/admin/ai/chat requires a valid admin session, matching Origin, explicit confirmation, bounded input and shared rate limiting (12 turns/15 minutes/session). Context is server-resolved; another session's conversation cannot be read or continued. Turns are saved before generation, with UUID deduplication; interrupted responses are marked failed after three minutes when a new turn is attempted. No automatic retries.

Known secret values and credential-shaped strings are redacted before persistence/provider input/output. Hidden instructions are never returned through an API; obvious extraction requests receive a refusal. AI output is untrusted draft content rendered as escaped plain text, not executable HTML. Never paste credentials or sensitive data; redaction is defense in depth, not a replacement for input review.

The Responses API uses strict JSON output, store=false, a 60-second timeout and bounded output. Token usage and model are persisted; no provider error bodies or secret values are logged. store=false does not promise zero provider retention.

Run node scripts/test-ai-chat.mjs, npm run lint, npm run build, and authenticated/unauthenticated route and conversation-isolation tests. No deployment is part of this change.

## Changed files

Local verification passed: migration, lint, production build, existing routes, anonymous chat rejection, authenticated chat with synthetic request context, persisted reload, session isolation, duplicate turn rejection, wrong-Origin rejection, missing-key UI/API, and 320px overflow check. One synthetic exchange is retained in PostgreSQL; no customer communications or deployment occurred.

- app/admin/ai/page.tsx
- app/api/admin/ai/chat/route.ts
- app/admin/page.tsx
- app/admin/requests/[id]/page.tsx
- components/webfactory/ai-chat.tsx
- components/webfactory/ai-chat.css
- components/webfactory/build-panel.tsx
- lib/webfactory/chat-safety.ts
- lib/webfactory/chat-provider.ts
- lib/webfactory/chat-store.ts
- lib/webfactory/server.ts
- db/migrations/0004_webfactory_ai_chat.sql
- scripts/migrate-webfactory.mjs
- scripts/test-ai-chat.mjs
- docs/admin-ai-workspace.md
