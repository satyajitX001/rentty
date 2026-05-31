# RentOk Product TODOs and Roadmap

This document is a product and engineering audit of the current RentOk mobile app and backend. It focuses on what is implemented, what is still incomplete, and what should be added to make the product useful for a larger owner/caretaker audience.

## Current Implemented Surface

- Owner/caretaker mobile authentication
- Owner signup
- Development forgot/reset password flow
- Dashboard with profile, property operations, occupancy metrics, dues, collections, alerts, and support summary
- Property create/edit and caretaker assignment by phone
- Tenant create/edit/remove with vacate reason
- Tenant payment deposit, payment history, and past payment editing
- Automatic due calculation and due recalculation after payment edits
- Collections ledger with pending tenants and recent payments
- Maintenance request list and status update
- Expenses, finance, reports, documents, notifications, and support module wiring
- Report generation with backend fallback download support

## Launch Blockers

- Password reset must be productionized. The current backend implementation is development-only because it uses a hardcoded code and returns the reset token from the API.
- Document upload still depends on Cloudinary credentials and needs a verified production file policy.
- Reports currently generate JSON-backed files with `xlsx`/`pdf` extensions. Production reports should generate real XLSX/PDF files.
- No automated test suite is configured. The riskiest flows are dues calculation, payment editing, role scoping, tenant removal, and caretaker assignment.
- API reference files contain some stale examples. The source of truth is currently the backend Zod schemas plus `FRONTEND_API_GUIDE.md`.
- Mobile forms need stronger validation UX, especially dates, phone numbers, amounts, and required fields.

## Near-Term Product TODOs

- Add a proper property detail screen instead of keeping every property action inside Dashboard modals.
- Add month filters and paid-month/due-month controls in Collections.
- Add explicit tenant transaction receipts with share/download capability.
- Add tenant search, property filter, and status filters.
- Add caretaker-visible permissions UX so caretakers know why some actions are hidden.
- Add maintenance creation from the mobile app, not only status movement.
- Add expense creation/editing from mobile.
- Add document upload from tenant/property detail screens.
- Add empty states that show actionable next steps based on owner/caretaker role.
- Add confirmation and audit notes to historical payment edits.

## Backend TODOs

- Replace development reset token with OTP delivery via SMS/WhatsApp/email.
- Store hashed password reset tokens instead of plain token strings.
- Add integration tests for auth, property scoping, tenant lifecycle, payment edit recalculation, and report generation.
- Add transaction/session handling around tenant creation/removal and property occupancy updates.
- Add audit log model for payment edits, tenant edits, property edits, and role-sensitive changes.
- Add pagination to list endpoints.
- Add consistent response envelope rules. Current helper flattens object payloads, which the frontend works around.
- Add production queue processors for reminders and notifications.
- Add Cloudinary/file upload validation for MIME type, file size, and entity access.

## Growth Features for Higher MAU

- WhatsApp rent reminders with payment links and receipt sharing.
- Owner daily digest: dues due today, collections received, open complaints, occupancy changes.
- Tenant-facing lightweight web link for payment status, receipt history, and complaint raising.
- Smart dues calendar with automatic monthly accrual preview.
- Multi-property portfolio analytics: occupancy, collection rate, delayed tenants, expenses, net cash flow.
- Offline-first caretaker mode for collections and maintenance notes in low-connectivity buildings.
- Staff/caretaker task assignment with due dates and completion proof.
- KYC checklist with Aadhaar/PAN/lease documents and expiry reminders.
- Lead/inquiry management for vacant properties.
- Room/unit inventory model for buildings that have multiple rooms or beds.
- Referral loop for owners: invite another owner, get free report exports or message credits.
- Payment gateway integration with UPI intent, payment reconciliation, and automatic receipt generation.
- Owner subscription plans based on property count, tenant count, reminders, and report exports.

## Recommended Milestones

### Milestone 1: Launch Hardening

- Production OTP delivery
- Real report file generation
- Integration tests for money and occupancy flows
- Strong form validation
- API reference cleanup

### Milestone 2: Daily Operations

- Property detail screen
- Tenant search/filter
- Maintenance creation
- Expense creation/editing
- Receipt share/download
- Collections filters

### Milestone 3: Retention and Growth

- WhatsApp reminders
- Owner daily digest
- Tenant payment status links
- Portfolio analytics
- Referral and subscription hooks

### Milestone 4: Scale

- Pagination and query optimization
- Audit log and admin portal
- Payment gateway reconciliation
- Offline-first sync for caretakers
- Role and permission management UI
