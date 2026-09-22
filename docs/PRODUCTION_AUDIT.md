# RentOk Production Audit

Running audit for `rentty` and `rentok-backend`. Dependency/build folders such as `node_modules`, `.git`, `.expo`, and `dist` are excluded.

## Current Mental Model

- `rentty` is an Expo React Native app using TanStack Query, Axios, SecureStore-backed auth persistence, and API service normalizers.
- `rentok-backend` is an Express + TypeScript + MongoDB API with module-level routes/controllers/services/models/schemas.
- Auth uses access tokens plus persisted refresh tokens. Mobile retries protected API calls after `/auth/refresh`.
- Owner/caretaker scoping is property-based. Owners see properties they created; caretakers see assigned/managed properties.
- Tenant rent dues are derived from `joinedOn`, `rentDueDay`, `monthlyRent`, `openingDueAmount`, and historical rent payments. `securityDeposit` is separate from rent due math; legacy `advanceAmount` remains as a backward-compatible alias.
- Collections create immutable payment records except edit support through `PATCH /collections/payments/:id`, then tenant due is recalculated.
- Dashboard recomputes current tenant dues and aggregates collections, expenses, maintenance, occupancy, and dues.

## Critical Issues

### CRIT-001: Security deposit must not reduce rent due

- **Files:** `rentok-backend/src/modules/tenants/tenants.due.ts`, `rentok-backend/src/modules/tenants/tenants.service.ts`, `rentok-backend/src/modules/dashboard/dashboard.service.ts`, `rentok-backend/src/modules/collections/collections.service.ts`
- **Affected modules:** Tenant lifecycle, collections, dashboard pending dues, reports relying on tenant due.
- **Problem:** `advanceAmount` is a refundable security deposit collected at move-in, not prepaid rent.
- **Impact:** If security deposit is subtracted from rent dues, dashboard pending dues, tenant cards, collection receipt balances, reports, reminders, and exports understate actual rent receivable.
- **Root cause:** The field name `advanceAmount` is ambiguous and can be misread as advance rent.
- **Proposed fix:** Keep the rent formula as `accruedRent + openingDueAmount - totalPaid`; never subtract `advanceAmount` in rent-ledger calculations.
- **Implementation status:** Fixed. The temporary subtraction change was reverted, and frontend labels now call the field “Security deposit”.

### CRIT-002: Report generation was not scoped by owner/caretaker access

- **Files:** `rentok-backend/src/modules/reports/reports.service.ts`, `rentok-backend/src/modules/reports/reports.controller.ts`
- **Affected modules:** Reports, dues exports, tenant exports, collection exports, expense exports, complaint exports.
- **Problem:** `POST /reports/generate` queried tenants, payments, expenses, and maintenance records without filtering by the requester’s accessible properties.
- **Impact:** A non-admin user could generate reports containing data from other landlords/caretakers.
- **Root cause:** `ReportService.generate` accepted only `userId`, not `role`, and `getData` had no access-scope filter.
- **Proposed fix:** Pass role into report generation and apply `propertyId` scoping via `getScopedPropertyIds` for all property-linked report types.
- **Implementation status:** Fixed.

### CRIT-003: Document metadata and uploads were not scoped by entity access

- **Files:** `rentok-backend/src/modules/documents/documents.service.ts`, `rentok-backend/src/modules/documents/documents.controller.ts`
- **Affected modules:** Documents, tenant/property/maintenance/expense/support/report attachments.
- **Problem:** `GET /documents` and `POST /documents/upload` trusted arbitrary `entityType` and `entityId` values without checking whether the requester could access that entity.
- **Impact:** A user who guessed an entity id could list or upload documents against another landlord’s records.
- **Root cause:** Document records store generic entity references, but the service did not resolve those references back to property/user ownership before acting.
- **Proposed fix:** Add entity-aware authorization for properties, tenants, maintenance, expenses, support tickets, reports, and user-owned `other` documents.
- **Implementation status:** Fixed.

### CRIT-004: Notification scheduling accepted unscoped tenant ids

- **Files:** `rentok-backend/src/modules/notifications/notifications.service.ts`, `rentok-backend/src/modules/notifications/notifications.controller.ts`
- **Affected modules:** Notifications, tenant reminders.
- **Problem:** `POST /notifications/schedule` could attach a notification to any tenant id without verifying property access.
- **Impact:** A user could create notifications targeting tenants outside their landlord/caretaker scope.
- **Root cause:** Notification scheduling only recorded `userId`; it did not resolve `tenantId` to its property before scheduling.
- **Proposed fix:** Resolve `tenantId` and call `assertPropertyAccess` before creating the notification.
- **Implementation status:** Fixed.

## High Priority

### HIGH-001: Collection notes are sent by frontend but stripped by backend validation

- **Files:** `rentty/src/services/api/collectionService.ts`, `rentok-backend/src/modules/collections/collections.schema.ts`, `rentok-backend/src/modules/collections/collections.model.ts`
- **Affected modules:** Collections, tenant payment history.
- **Problem:** The mobile app sends `notes` during payment collection, and the payment model supports it, but `collectPaymentSchema` does not allow it.
- **Impact:** First-time collection notes are silently discarded, while edited payment notes are persisted.
- **Root cause:** Create and update payment schemas diverged.
- **Proposed fix:** Add optional trimmed `notes` to `collectPaymentSchema`.
- **Implementation status:** Fixed.

### HIGH-002: Password reset returns and logs static OTP

- **Files:** `rentok-backend/src/modules/auth/auth.service.ts`, `rentty/src/screens/auth/ForgotPasswordScreen.tsx`
- **Affected modules:** Authentication, Play Store production readiness.
- **Problem:** Forgot-password uses hardcoded token `1234`, returns it to the client, and logs it.
- **Impact:** Anyone who can request reset for a known phone can reset the account password if this ships.
- **Root cause:** Development-only OTP flow remains active in production path.
- **Proposed fix:** Integrate SMS/WhatsApp/email OTP provider, never return OTP to clients, hash OTP/reset tokens, and redact token logs.
- **Implementation status:** Partially fixed. Backend no longer logs the reset token, but the dev OTP response remains a production launch blocker until a real delivery provider is integrated.

### HIGH-003: Sensitive values could appear in error logs

- **Files:** `rentok-backend/src/middleware/errorHandler.ts`, `rentok-backend/src/modules/auth/auth.service.ts`
- **Affected modules:** Authentication, global API error handling, production observability.
- **Problem:** Failed requests logged `req.body` directly, and auth-service catch blocks logged payloads containing passwords.
- **Impact:** Passwords, refresh tokens, and reset tokens could be stored in production logs.
- **Root cause:** Logging was designed for debugging, not production redaction.
- **Proposed fix:** Redact sensitive field names at the global error handler and auth-service payload logs.
- **Implementation status:** Fixed.

### HIGH-004: Dues reports could miss old tenants and use stale balances

- **Files:** `rentok-backend/src/modules/reports/reports.service.ts`, `rentok-backend/src/modules/tenants/tenants.due.ts`
- **Affected modules:** Dues reports, export correctness, pending-balance review.
- **Problem:** Dues report generation filtered tenants by `createdAt` and trusted stored `dueAmount`.
- **Impact:** Long-standing tenants with current dues could be excluded, and reports could show stale balances if dashboard/tenant-list recalculation had not run recently.
- **Root cause:** Dues are derived values, but report generation treated them as static tenant fields.
- **Proposed fix:** Recompute dues for scoped active tenants as of report `to` date, persist corrected balances, and export tenants with positive recalculated dues.
- **Implementation status:** Fixed.

### HIGH-005: Default caretaker temporary password was production-allowed

- **Files:** `rentok-backend/src/config/env.ts`, `rentok-backend/.env.example`, `rentty/src/screens/AssignCaretakerScreen.tsx`, `rentty/src/screens/DashboardScreen.tsx`
- **Affected modules:** Caretaker onboarding, authentication, production configuration.
- **Problem:** Backend defaulted `CARETAKER_TEMP_PASSWORD` to `ChangeMe123`, including production, and frontend displays the temporary password after assignment.
- **Impact:** If the env var is omitted in production, newly auto-created caretaker accounts share a predictable password.
- **Root cause:** Development fallback was not gated by `NODE_ENV`.
- **Proposed fix:** Keep the fallback for non-production development only; require a configured 12+ character value when `NODE_ENV=production`.
- **Implementation status:** Fixed.

## Medium Priority

### MED-001: Rename `advanceAmount` to `securityDeposit`

- **Files:** `rentok-backend/src/modules/tenants/*`, `rentty/src/services/api/tenantService.ts`, `rentty/src/types/models.ts`, tenant forms/screens
- **Affected modules:** Tenant onboarding, tenant editing, final settlement, future ledger work.
- **Problem:** The persisted/API field name `advanceAmount` is ambiguous and can be mistaken for prepaid rent.
- **Impact:** Future due-calculation work may accidentally treat security deposit as rent credit again.
- **Root cause:** Domain terminology does not match the current business rule.
- **Proposed fix:** Rename to `securityDeposit` through a backward-compatible migration: add `securityDeposit`, read fallback from `advanceAmount`, dual-write temporarily, migrate data, then remove `advanceAmount` after clients update.
- **Implementation status:** In progress. `securityDeposit` is now the primary frontend/backend field, while `advanceAmount` remains accepted, returned, and dual-written for backward compatibility.

### MED-002: Dashboard writes a snapshot on every summary read

- **Files:** `rentok-backend/src/modules/dashboard/dashboard.service.ts`
- **Affected modules:** Dashboard, database growth, performance.
- **Problem:** Every `GET /dashboard/summary` creates a `DashboardSnapshot`.
- **Impact:** Frequent app refreshes can create unbounded duplicate records and unnecessary writes.
- **Root cause:** Read endpoint doubles as snapshot generator.
- **Proposed fix:** Move snapshotting to scheduled/explicit job or upsert by user/month/time bucket.
- **Implementation status:** Pending.

### MED-003: No automated tests for core rent calculation

- **Files:** `rentok-backend/package.json`, `rentok-backend/src/modules/tenants/tenants.due.ts`
- **Affected modules:** Due engine, collections, dashboard.
- **Problem:** The highest-risk calculation path has no automated test coverage.
- **Impact:** Regressions in partial payments, opening dues, backdated joins, month transitions, and vacating tenants can ship unnoticed.
- **Root cause:** Test framework is not configured; `npm test` is a placeholder.
- **Proposed fix:** Add a lightweight backend test runner and unit tests around `getAccruedDueMonths` / `calculateTenantDueAmount`.
- **Implementation status:** Pending.

## Low Priority

### LOW-001: Draft API docs conflict with authoritative QA guide

- **Files:** `rentty/docs/API_ENDPOINTS.md`, `rentok-backend/API_REFERENCE.md`, `rentty/docs/FEATURE_TEST_AND_QA_GUIDE.md`
- **Affected modules:** Developer handoff, QA.
- **Problem:** Some docs still mention stale response envelopes and roles.
- **Impact:** Future integration work can target wrong contracts.
- **Root cause:** Historical docs were not retired after backend contract changes.
- **Proposed fix:** Mark stale docs as legacy or update them to match Zod schemas and `FEATURE_TEST_AND_QA_GUIDE.md`.
- **Implementation status:** Pending.
