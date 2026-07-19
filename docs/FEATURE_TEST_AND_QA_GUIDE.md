# RentOk — Feature Test & QA Guide (Frontend + Backend Cross-Checked)

> Purpose: A complete, agent-ready reference for manually testing every user-facing feature of the
> RentOk app against the **real backend**, verifying behavior, and deciding whether the existing
> functionality is production-ready.
>
> This version was cross-checked against the actual backend in `rentok-backend/` (Express 5 +
> Mongoose 9). Every endpoint, validation rule, and response shape below was verified against the
> server source — not against the stale `docs/API_ENDPOINTS.md`.

---

## 1. System overview

| Layer | Stack |
|---|---|
| **Mobile** | Expo 54 + React Native 0.81, React 19, TypeScript, TanStack Query, Axios (auto token-refresh), Expo SecureStore |
| **Backend** | Express 5, Mongoose 9 (MongoDB), jsonwebtoken, bcryptjs, Zod validation, helmet/cors/morgan, winston |
| **Optional backend deps** | Cloudinary (report hosting), Redis + BullMQ (reminders — see §7.9) |

Backend source: `rentok-backend/src/modules/<feature>/{routes,controller,service,schema,model}.ts`.

**Mounted under `/api/v1`** (confirmed in `app.ts`). Health: `GET /health`.
The mobile `API_BASE_URL = https://rentok-backend.onrender.com/api/v1` matches.

---

## 2. Run both apps for testing

### Backend
Requires a `.env` (or exported env vars) in `rentok-backend/`:

```
MONGO_URI=mongodb://localhost:27017/rentok      # REQUIRED, no default
JWT_SECRET=at-least-16-char-secret              # REQUIRED, >=16 chars
JWT_REFRESH_SECRET=another-16-char-secret       # REQUIRED, >=16 chars
JWT_EXPIRES_IN=15m                               # default
JWT_REFRESH_EXPIRES_IN=7d                        # default
PORT=5000                                        # default
CARETAKER_TEMP_PASSWORD=ChangeMe123             # default if omitted (min 6)
CLOUDINARY_CLOUD_NAME=  CLOUDINARY_API_KEY=  CLOUDINARY_API_SECRET=   # optional
```

- `cd rentok-backend && npm install && npm run dev` (ts-node) or `npm run build && npm start`.
- If `MONGO_URI` / JWT secrets are missing, the server **fails to boot** (`env.ts` validates at startup).
- Redis is **not** required at startup (the reminder path only persists a doc; no queue connects).
- If Cloudinary is **not** configured, reports fall back to a local token download URL.

### Mobile
- Point `src/services/api/config.ts` `API_ROOT_URL` at your backend (onrender default, or your LAN/localhost for local testing).
- `npm install && npm run start` → Android / iOS / Expo Go / web.
- No automated tests are configured (same as before). This is a **manual** QA guide.

> ⚠️ **Rate limit (critical for testers):** all `/auth/*` endpoints use `authLimiter` =
> **10 requests per IP per 15 minutes**. Exceeding it returns **HTTP 429 "Too many auth attempts"**.
> A tester (or AI agent) hammering login/signup/forgot/reset will get blocked. Space out auth calls,
> or reset the in-memory counter by restarting the backend.

---

## 3. Authoritative API contract (verified against backend)

Legend: **A** = requires `Authorization: Bearer <accessToken>` · **Role** = server-enforced ·
**M** = called by the mobile app.

| Method | Path | A | Role | Request (Zod) | Response | M |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | | | name≥2, phone 8–20, password≥6, role enum, ownerId? | 201 `{token,refreshToken,user{id,name,role}}` | ✓ |
| POST | `/auth/login` | | | phone 8–20, password≥1 | `{token,user{id,name,role},refreshToken}` | ✓ |
| POST | `/auth/refresh` | | | refreshToken≥1 | `{token}` (no new refresh token) | ✓ |
| POST | `/auth/refresh-token` | | | — | **404** (client probes this as fallback; harmless) | (probe) |
| POST | `/auth/logout` | | | refreshToken≥1 | success | ✗ (mobile clears locally, never calls) |
| GET | `/auth/me` | ✓ | | — | `{user{id,name,phone,role}}` | (exists, not used on launch) |
| PATCH | `/auth/me` | ✓ | | name≥2, phone 8–20 | `{user}` | ✓ |
| PATCH | `/auth/me/password` | ✓ | | currentPassword≥1, newPassword≥6 | success | ✓ |
| POST | `/auth/forgot-password` | | | phone 8–20 | `{resetToken:"1234"}` (dev OTP) | ✓ |
| POST | `/auth/reset-password` | | | token≥1, newPassword≥6 | success | ✓ |
| GET | `/dashboard/summary` | ✓ | scoped | — | `{totalProperties,occupiedProperties,availableProperties,activeTenants,pendingDues,monthCollection,openMaintenance,monthExpenses,totalBeds,occupiedBeds}` | ✓ |
| GET | `/properties` | ✓ | scoped | — | `{properties[]}` | ✓ |
| POST | `/properties` | ✓ | OWNER/ADMIN | name≥2, address≥5, type?enum, location?, floors?≥0, rooms?≥0, flatSize?enum, amenities?, totalBeds?≥0, caretaker?≥2, caretakerPhone?8–20 | `{property}` (now persists type/location/floors/rooms/flatSize/amenities/totalBeds) | ✓ |
| GET | `/properties/:id` | ✓ | scoped | — | `{property}` | ✗ |
| PUT | `/properties/:id` | ✓ | OWNER/ADMIN | partial of create (incl. above fields) | `{property}` | ✓ |
| PATCH | `/properties/:id/caretaker` | ✓ | OWNER/ADMIN | caretaker?≥2, caretakerPhone 8–20 | `{property,onboarding}` | ✓ |
| DELETE | `/properties/:id` | ✓ | OWNER/ADMIN | — | `{property}` | ✗ |
| GET | `/tenants` | ✓ | scoped | propertyId?, status?, includeInactive? | `{tenants[]}` | ✓ |
| POST | `/tenants` | ✓ | (property access) | fullName≥2, fullAddress≥5, phone 8–20, propertyId≥1, monthlyRent≥0, rentDueDay 1–31 int, joinedOn date, securityDeposit?/legacy advanceAmount?, +optional | `{tenant}` (400 if occupied / joinedOn future) | ✓ |
| GET | `/tenants/:id` | ✓ | scoped | — | `{tenant}` | ✗ |
| PUT | `/tenants/:id` | ✓ | scoped | partial update | `{tenant}` | ✓ |
| PATCH | `/tenants/:id/lease` | ✓ | scoped | leaseEnd?, monthlyRent?, remarks? | `{tenant}` | ✗ |
| PATCH | `/tenants/:id/remove` | ✓ | scoped | reason≥3, vacatedOn? | `{tenant}` (400 if vacatedOn<joinedOn) | ✓ |
| GET | `/collections/payments` | ✓ | scoped | month?, tenantId?, propertyId? | `{payments[]}` | ✓ |
| POST | `/collections/collect` | ✓ | scoped | tenantId≥1, amount>0, dueMonth?`YYYY-MM`, paidOn date, mode enum, utr? | 201 `{payment, receipt{balanceDue,...}}` | ✓ |
| PATCH | `/collections/payments/:id` | ✓ | scoped | amount>0?, dueMonth?`YYYY-MM`, paidOn?, mode?, utr?, notes? | `{payment}` | ✓ |
| POST | `/collections/reminders` | ✓ | scoped | tenantIds[], channel enum, message? | 201 `{reminder}` (not dispatched) | ✗ |
| GET | `/maintenance/requests` | ✓ | scoped | status?, month? | `{requests[]}` | ✓ |
| POST | `/maintenance/requests` | ✓ | scoped | propertyId≥1, roomNumber≥1, **title≥3**, priority enum, +optional | 201 `{request}` | ✓ |
| PATCH | `/maintenance/requests/:id/status` | ✓ | scoped | status enum, serviceProvider?, actualCost? | `{request}` | ✓ |
| GET | `/expenses` | ✓ | scoped | month? | `{expenses[]}` | ✓ |
| POST | `/expenses` | ✓ | scoped | — | 201 `{expense}` | ✗ |
| GET | `/finance/reports/pnl` | ✓ | scoped | from, to | `{totalCollection,totalExpense,net}` | ✗ |
| GET | `/documents` | ✓ | scoped | **entityType + entityId required** | `{documents[]}` | ✗ |
| POST | `/documents/upload` | ✓ | scoped | file + entityType, entityId, tags? | 201 `{document}` | ✗ |
| POST | `/reports/generate` | ✓ | scoped | reportType enum, from date, to date, format enum(xlsx\|pdf) | 201 `{reportId,fileName,downloadUrl}` | ✓ |
| GET | `/reports/:id/download` | | token | `?token=` | file (binary) | ✓ (used if no Cloudinary) |
| GET | `/reports/:id/auth-download` | ✓ | scoped | — | file | ✗ |
| GET | `/notifications` | ✓ | — | — | `{notifications[]}` (**now includes optional `title`**) | ✓ (read only) |
| POST | `/notifications/schedule` | ✓ | — | — | 201 `{notification}` | ✗ |
| GET | `/support/tickets` | ✓ | — | — | `{tickets[]}` (**`createdAt`, not `createdOn`**) | ✓ (read only) |
| POST | `/support/tickets` | ✓ | — | — | 201 `{ticket}` | ✗ |

**Response envelope:** success → `{ success:true, message, ...data }` (object data is spread at top
level; arrays/primitives wrapped in `data`). Error → `{ success:false, message }`. A Zod validation
failure returns `{ success:false, message:"Validation failed", errors:[...] }` — **no field-level
text in `message`**, so the mobile shows the generic "Validation failed" string.

**Validation strictness:** Zod `.parse` **strips unknown keys** (does *not* 400 on extra fields). The
property schema now models `type`, `location`, `floors`, `rooms`, `flatSize`, `amenities`, `totalBeds`,
so those sent by the mobile are **persisted** (previously silently ignored). `occupiedBeds` is computed
server-side on every read and is never client-controlled.

---

## 4. Server-authoritative behaviors (verify these, don't assume client logic)

1. **Dues are computed server-side and never drift.** `calculateTenantDueAmount` accrues
   `months from joinedOn (aligned to rentDueDay) × monthlyRent + openingDueAmount − totalPaid`,
   floored at 0 and rounded. It is **recomputed on every** tenant list / get / update / remove **and**
   on every dashboard summary. → Editing a past payment correctly updates `dueAmount` on the next
   fetch. (The earlier "dues drift" concern is resolved by the backend.)
2. **Security deposit is separate from rent dues.** New clients send `securityDeposit`; the backend still accepts legacy `advanceAmount` and dual-writes both fields for old clients/data. Security deposit must never reduce current due, pending rent, dashboard balances, collection receipt `balanceDue`, reports, reminders, or exports.
3. **One active tenant per property is enforced server-side.** `POST /tenants` returns `400
   "Property is currently occupied. Remove existing tenant first."` if an active tenant exists.
   `remove` sets `active=false`, `status=vacated`, and flips the property to `available`.
4. **RBAC scoping.** Owners see only properties they created (`createdBy`) and their tenants;
   caretakers see only properties they're linked to. **Caretakers cannot create/update/delete/assign
   properties** → `403`. Admin sees all.
4. **Refresh returns only a new access token** (no rotation); the client keeps the same refresh token
   (valid 7 days). The client also probes `/auth/refresh-token` (404) — harmless.
5. **Password reset is development-only:** the reset code is a **hardcoded `"1234"`** and no SMS is
   sent (`auth.service.requestPasswordReset`). `forgot-password` returns `{ resetToken:"1234" }`.
6. **Maintenance `title` requires ≥3 chars** on the backend (see §5 mismatch F13b).
7. **Collections `amount` must be > 0**; `dueMonth`, if sent, must match `YYYY-MM`.
8. **Reports:** `generate` returns `{reportId,fileName,downloadUrl}`. With Cloudinary → absolute
   `secure_url` (opened directly). Without → relative `/api/v1/reports/:id/download?token=...` which
   the mobile resolves to an absolute URL and opens (no auth needed). `LEAD` report returns empty.
9. **Reminders are persisted but never dispatched** (no queue/SMS/WhatsApp wired). Mobile doesn't call
   this endpoint anyway.
10. **Login / `getMe` user payload has no `phone`** (only `id,name,role`). Mobile treats phone as
    optional, so the drawer simply shows none.

11. **Property attributes are now persisted (M1 resolved).** `type` (hostels/flat/villa), `location`,
    `floors`, `rooms`, `flatSize` (1BHK/2BHK/3BHK), `amenities`, and `totalBeds` are stored on
    create/update (server defaults: `type=hostels`, `totalBeds=0`). `occupiedBeds` is **computed
    server-side** from active tenants on every list/get and surfaced in the dashboard summary — it is
    never overwritten by the client even if sent.
12. **Notification `title` is now persisted and returned (M4 resolved).** `POST /notifications/schedule`
    accepts an optional `title`; `GET /notifications` returns it. Dashboard "Signals" renders a real
    title when one is provided (mobile falls back to `message`).

---

## 5. Feature test cases (updated with server expectations)

Each: **Precondition → Steps → Expected (backend-verified) → Pass/Fail**.

### F1 — Login
- **Steps:** 10-digit phone + correct password → Sign In; wrong password; 9-digit phone (button
  disabled); toggle password; kill+reopen (session restored).
- **Expected:** valid → Dashboard. Wrong → inline error (`message` from server). 9-digit → disabled
  (`canSubmit = phone.length===10`). Refresh token persisted in SecureStore; auto-restored on launch.
- **Endpoint:** `POST /auth/login`. ⚠️ Respect the 10/15-min rate limit (§2).

### F2 — Owner Sign Up
- **Steps:** name + 10-digit phone + password(≥6) → Create Account.
- **Expected:** `POST /auth/register` returns tokens → straight to Dashboard (mobile auto-signs-in).
  `role` hard-coded `"owner"`. Caretaker signup unavailable in-app.

### F3 — Password reset (dev)
- **Steps:** Forgot Password → phone → Send Reset Code → (backend returns `resetToken:"1234"`) →
  Reset Password screen → enter **code `1234`** + new password(≥6).
- **Expected:** `POST /reset-password` with `{token:"1234", newPassword}`. **BLOCKER for prod:** no
  real OTP/SMS; code is always `1234`.

### F4 — Dashboard
- **Pre:** ≥1 property + ≥1 tenant; **seed notifications & support tickets via API** (no in-app create).
- **Steps:** open Dashboard; check metrics; tap property → actions; Add Tenant / Assign Caretaker;
  drawer → profile / password / theme / logout.
- **Expected:** metrics from `GET /dashboard/summary`, which now includes **`totalBeds`/`occupiedBeds`**
  (M2 resolved). "Signals" render `title || message` — **title now real** when seeded (M4 resolved),
  not blank. "Support Queue" shows `subject`/`status` and a **real "Created" date** (mobile maps
  `createdAt`→`createdOn`, M5 resolved; M6 = no in-app create, by design). Property cards show real
  **"occupied/total beds"** (M2 resolved), not "0/0". Occupied/available counts correct.

### F5 — Property create / edit  ✅ backend now persists type/location/floors/rooms/flatSize/amenities/totalBeds
- **Steps:** Dashboard → PropertyForm → name(≥2), address(≥5), Type (hostels/flat/villa), type-specific
  fields, total beds, optional caretaker → Save. Reopen → Edit → Update.
- **Expected:** `POST/PUT /properties` now accepts `type`,`location`,`floors`,`rooms`,`flatSize`,
  `amenities`,`totalBeds` (optional; server defaults `type=hostels`,`totalBeds=0`). **These are now
  persisted and returned** (M1 resolved) — verify in DB that `type`/`floors`/etc. survive. `occupiedBeds`
  is server-computed (ignored if sent). On success, lists + summary refetch and bed counts update.
- **Note:** a **caretaker** tapping Save gets `403 "Caretaker cannot create properties"` (B3).

### F6 — Assign caretaker (onboarding)
- **Steps:** Property Actions → Assign Caretaker → name(optional) + mobile(≥8) → Save.
- **Expected:** `PATCH /properties/:id/caretaker`.
  - New caretaker phone → account auto-created, alert shows phone + temp password
    (`CARETAKER_TEMP_PASSWORD`, default `ChangeMe123`). `onboarding.accountCreated:true`.
  - Existing caretaker (same owner) → just linked, `accountCreated:false`.
  - Phone belongs to a **non-caretaker** user → `400`. Caretaker belongs to **another owner** → `403`.
  - Caretaker role attempting this → `403`.

### F7 — Tenant create
- **Entry:** Dashboard property detail / Tenants tab (disabled if occupied) / Property Actions.
- **Validation (client):** name≥2, address≥5, phone≥8, rent≥0, rentDay 1–31, joinedOn required.
- **Server:** same minimums; `joinedOn` **cannot be in the future** → `400`; property **occupied** →
  `400`; phone normalized to **+91 prefix** by the mobile before send (M8 resolved — matches auth formatting).
- **Expected:** `POST /tenants` → tenant created, property flips to `occupied`, dueAmount computed from rent/opening due/payments only. Entering a security deposit must not reduce `dueAmount`.

### F8 — Tenant edit
- Same validation as F7. `PUT /tenants/:id`. Due recomputed.

### F9 — Record collection
- **Validation:** amount>0, paidOn required, dueMonth exactly `YYYY-MM`, mode enum.
- **Server:** `amount` must be **>0** (not ≥0) → else `400`; `dueMonth` optional but if present must be
  `YYYY-MM`. `POST /collections/collect` returns `{payment, receipt{balanceDue}}`.
- **Expected:** dashboard dues/collection + tenant due update on refetch (server-authoritative).

### F10 — Payment history + edit past payment
- **Steps:** Tenants tab → tenant → Payment History → edit a payment → Update.
- **Expected:** `PATCH /collections/payments/:id`; due recomputed (§4.1). **Note:** a payment with a
  **future `paidOn` is excluded** from `totalPaid` until that date passes (due won't drop yet).

### F11 — Remove (vacate) tenant
- **Validation:** reason≥3.
- **Server:** `vacatedOn` **cannot be earlier than `joinedOn`** → `400`. On success, property freed.
- **Endpoint:** `PATCH /tenants/:id/remove`.

### F12 — Collections ledger
- `GET /collections/payments?month=YYYY-MM` (matched against `month`/`dueMonth`/`paidMonth`).
- Pending = tenants with `dueAmount>0`; Collected = sum of that month's payments.

### F13 — Maintenance
- **Steps:** + Add → property, title, room, date, amount, priority → Save; advance status
  open→in_progress→resolved.
- **Mismatch F13b resolved:** both backend (Zod ≥3) and mobile (`MaintenanceScreen` ≥3) now require
  **≥3 chars** for `title`. A 2-char title is blocked client-side (button disabled) and server-side.
  Test a 2-char title → blocked before submit.
- **Server:** `POST /maintenance/requests`; status advances one step; resolved is locked. Resolved
  Spend = sum of `estimatedCost`/`actualCost` for resolved items.

### F14 — Reports (PDF)
- **Steps:** Reports → type (dues/complaint/tenant/expense/lead/collection) → month → Download PDF.
- **Expected:** `POST /reports/generate` `{reportType, from, to, format:"pdf"}`. Opens `downloadUrl`
  (Cloudinary absolute, or resolved token URL). `LEAD` → empty file. Verify the downloaded file opens.

### F15 — Notifications & Support (read-only, **need seeded data**)
- **Expected:** Dashboard "Signals" = `GET /notifications` (now returns `title`; mobile renders
  `title || message`, **M4 resolved**); "Support Queue" = `GET /support/tickets` (mobile maps
  `createdAt`→`createdOn`, **M5 resolved**). There is **no in-app way to create either** — seed via
  `POST /notifications/schedule` (include `title`) and `POST /support/tickets`, or they show empty
  states. M6 (no in-app create) is by design.

### F16 — Profile / Password / Theme / Logout
- **Profile** `PATCH /auth/me` (name≥2, phone≥8). **Password** `PATCH /auth/me/password`
  (current must match or `400 "Current password is incorrect"`; new≥6).
- **Theme** toggles light/dark in memory only (no persistence confirmed).
- **Logout** clears tokens + SecureStore + query cache → Login, and now **calls `/auth/logout`**
  best-effort to revoke the refresh token server-side (M7 resolved; failures ignored for
  backward-compat with older backends). The refresh token no longer lingers 7 days after app logout.

### F17 — Token refresh & forced logout
- Trigger a 401 (e.g. expire access token) → client calls `POST /auth/refresh` → replays request.
  If refresh fails (bad/expired refresh token) → session cleared → Login.

### F18 — Error & empty states
- Backend down / 429 / 400 / empty data → spinner, explicit error card, or friendly empty copy. No crashes.

---

## 6. Backend ↔ Frontend mismatches & bugs (the production-readiness core)

| # | Severity | Mismatch | Impact | Fix direction |
|---|---|---|---|---|
| M1 | High | Mobile sends property `type`/`floors`/`rooms`/`flatSize`/`amenities`/`location`; **backend model had none** (only name/address/caretaker). Fields silently dropped. | Property "type" selector and all type-specific fields were cosmetic; not persisted or reflected anywhere. Misled users. | **RESOLVED:** backend schema/model now stores `type`/`location`/`floors`/`rooms`/`flatSize`/`amenities`/`totalBeds`; mobile persists them (F5). |
| M2 | High | Dashboard summary had **no `occupiedBeds`/`totalBeds`**; property model had none. | Property cards always showed **"0/0 beds"**; bed math was meaningless. | **RESOLVED:** Property model + dashboard summary now carry `totalBeds`/`occupiedBeds`; `occupiedBeds` computed server-side; Dashboard renders real counts (F4). |
| M3 | Med | Maintenance `title` requires **≥3** in Zod; mobile enforced **≥2**. | 2-char title passed mobile, failed server with vague "Validation failed". | **RESOLVED:** mobile `MaintenanceScreen` now enforces ≥3, matching backend (F13). |
| M4 | Med | Notification model had **no `title`** field (only `message`,`type`,`notifyOn`). Mobile `AlertItem` expects `title`. | Dashboard "Signals" rendered **blank titles**. | **RESOLVED:** notification model/schema/service persist `title`; `GET /notifications` returns it; mobile renders `title || message` (F15). |
| M5 | Med | Support returns `createdAt`; mobile expects `createdOn`. | Support Queue showed **blank "Created" date**. | **RESOLVED:** mobile `supportService` maps `createdAt`→`createdOn` (F15). |
| M6 | Med | Dashboard "Signals"/"Support Queue" have **no in-app create path** (mobile only reads). | Testers see empty sections unless data is seeded via API. | Document as expected, or add create UI. |
| M7 | Med | Mobile **Logout never called `/auth/logout`**. | Refresh token not revoked server-side; stayed valid 7 days after app logout. | **RESOLVED:** `AuthContext.signOut` now calls `/auth/logout` best-effort (F16). |
| M8 | Low | Tenant phones stored **without +91**; auth phones get +91 prefix. | Inconsistent phone formatting across collections; caretaker login vs tenant phone mismatch. | **RESOLVED (mobile):** `tenantService` normalizes tenant phones to `+91…` to match auth (F7/F8). Backend stores as sent. |
| M9 | Low | `GET /documents` requires **both** `entityType`+`entityId`; no mobile UI uses documents. | N/A for app today; any future doc UI must pass both. | — |
| M10 | Low | Login/`getMe` user has **no `phone`**; drawer shows none. | Minor (drawer phone blank). | Include phone in auth response. |

---

## 7. Known limitations / production blockers (verified)

1. **Password reset is dev-only** — hardcoded OTP `1234`, no SMS/email. **Hard blocker** for prod.
2. ~~Property `type` & bed counts not backed by data~~ **RESOLVED** (M1/M2) — backend now stores `type`/`location`/`floors`/`rooms`/`flatSize`/`amenities`/`totalBeds` and computes `occupiedBeds`; Dashboard renders real counts.
3. **No automated frontend or backend tests** configured.
4. **Auth rate limit 10/15min/IP** — must be accounted for in any automated testing.
5. ~~Logout doesn't revoke refresh token server-side~~ **RESOLVED** (M7) — `AuthContext.signOut` now calls `/auth/logout` best-effort.
6. **Reminders recorded but never dispatched** (no queue/SMS/WhatsApp).
7. **Reports depend on Cloudinary for hosted URLs**; without it, downloads use a local token URL
   (works, but files live in DB `fileData`). Verify Cloudinary config for prod file hosting.
8. **Dashboard writes a `DashboardSnapshot` on every summary call** — minor unbounded collection growth.
9. **`docs/API_ENDPOINTS.md` is historical/aspirational** — several listed endpoints (reminders,
   notifications/schedule, documents/upload, tenant/lease, expense create) are not wired in the mobile
   app. Test against §3, not that doc.

---

## 8. Production go / no-go checklist

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Login + session restore (cold start) | ☐ | F1, F17 |
| 2 | Owner signup + caretaker onboarding via assign | ☐ | F2, F6 |
| 3 | **Password reset prod-safe (real OTP)** | ☐ | F3 — **BLOCKER if No** |
| 4 | Property create/edit (type/bed fields now persist) | ✅ | F5, M1/M2 |
| 5 | Tenant lifecycle: create/edit/collect/remove | ☐ | F7–F11 |
| 6 | Collections ledger reconciles with backend sums | ☐ | F12 |
| 7 | Maintenance create + status (2-char title bug fixed) | ✅ | F13, M3 |
| 8 | Reports generate + open download | ☐ | F14 |
| 9 | Notifications/Support render (title/date gaps fixed) | ✅ | F15, M4/M5 |
| 10 | Profile/password/theme/logout (+ revoke token) | ✅ | F16, M7 |
| 11 | Token refresh + forced logout on failure | ☐ | F17 |
| 12 | Error/empty states never crash | ☐ | F18 |
| 13 | Backend contract matches §3 | ☐ | §3 vs §6 |
| 14 | Fix M1–M7 mismatches or explicitly defer | ✅ | §6 (M1–M5,M7,M8 done; M6 by design) |
| 15 | Automated tests added (recommended) | ☐ | no tests yet |

**Go requires:** all P0 green AND blocker #3 (password reset real OTP) resolved. M1/M2/M3/M4/M5/M7/M8
are now fixed (§6); M6 is by design. Remaining items 4–15 are required for a *clean* go-ahead.

---

## 9. Hand-off context for another AI testing agent

Paste this so the agent tests the **real, wired** behavior:

- **Repo:** `rentok-app` (Expo 54 / RN 0.81 / React 19 / TS) + backend `rentok-backend/` (Express 5 +
  Mongoose 9). Frontend: `npm install && npm run start`. Backend: needs `MONGO_URI`,
  `JWT_SECRET`(≥16), `JWT_REFRESH_SECRET`(≥16); `npm run dev`.
- **Backend is live at `https://rentok-backend.onrender.com/api/v1`**; health `GET /health`.
- **Authoritative endpoint list is §3 of this doc**, verified against `rentok-backend/src`. The draft
  `docs/API_ENDPOINTS.md` is aspirational — do NOT test against it.
- **Rate limit:** 10 auth calls / IP / 15 min → `429`. Space out auth tests or restart backend.
- **Password reset code is always `1234`** (dev). No SMS.
- **Business rules enforced server-side:** one active tenant per property (400 if occupied); dues
  recomputed from joinedOn/rentDueDay/monthlyRent/openingDue/payments (no drift); security deposit
  is separate from rent dues; owner-scoped data; caretakers
  cannot manage properties (403).
- **Validation minimums:** tenant name≥2/address≥5/phone≥8/rentDay 1–31; **maintenance title≥3**
  (mobile now aligned to ≥3 — F13); collection amount>0; dueMonth `YYYY-MM`.
- **Resolved contract gaps (verify they still hold):** property `type`/beds now persisted + computed
  (M1/M2); notification `title` persisted/returned (M4); support `createdAt`→`createdOn` mapped (M5);
  logout calls `/auth/logout` (M7); tenant phones normalized to +91 (M8); maintenance title min aligned (M3).
- **Still-open gaps (by design / deferred):** Dashboard "Signals"/"Support Queue" have no in-app
  create (seed via API, M6); `GET /documents` needs entityType+entityId (M9); auth response omits
  `phone` (M10); **password reset is dev-only (`1234`), no real OTP — hard blocker for prod.**
- **Dashboard "Signals" & "Support Queue" need seeded backend data** (no in-app create). Seed via
  `POST /notifications/schedule` and `POST /support/tickets`.
- **Report results with the §8 checklist** (Pass/Fail + evidence). Flag any app-vs-§3 divergence as a
  frontend or backend bug, referencing the M# from §6.

---

## 10. Quick smoke script (happy path, backend running)

1. Sign up owner → Dashboard.
2. Create property "LakeView PG" (note: `type`/bed fields won't persist — verify in DB).
3. Property → Add Tenant "Test User", rent 9000, due day 5, joined today → property shows Occupied.
4. Tenants tab → record collection 9000 UPI (dueMonth = current `YYYY-MM`) → due becomes 0.
5. Maintenance tab → log "Fan repair", room "101", amount 400, priority medium → advance to resolved.
6. Collections tab → collected 9000, pending 0.
7. Reports tab → collection report, current month → PDF opens.
8. Seed a notification + support ticket via API → Dashboard shows them (title/date gaps per M4/M5).
9. Drawer → Change Password → Logout → Login again (session restored). Confirm server refresh token
   still valid (M7).
10. Kill + reopen → still logged in (SecureStore).

If 1–7 pass with no crashes and numbers reconcile, the **core loop is production-viable**, pending the
blockers in §7 (especially #1 password reset, #2 property attributes, and M7 token revocation).
