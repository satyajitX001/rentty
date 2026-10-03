# RentOk App - QA Test Cases: Tenant Addition, Advance Records & Rent Calculation

## Overview
This document describes the tenant onboarding flow, advance/deposit handling, and rent due calculation logic for QA verification. All monetary values are in INR (₹).

---

## ⚠️ CRITICAL KNOWN BUG: Overpayment Credit Balance Lost

**Severity: HIGH** - Business logic error causing financial data loss

### The Bug
When a tenant pays **more than their due amount**, the excess payment is **silently discarded** - no credit balance is tracked.

```typescript
// Current code (TenantDetailsScreen.tsx:116)
dueAmount: Math.max(0, tenant.dueAmount - Number(paymentAmount))
```

### Example
| Event | Amount |
|-------|--------|
| Monthly Rent | ₹10,000 |
| Tenant Pays | ₹12,000 (advance for next month) |
| **Current Result** | Due: ₹0, **₹2,000 LOST** |
| **Correct Result** | Due: ₹0, **Credit Balance: ₹2,000** |

### Impact
- Landlords lose track of advance rent payments
- Extra maintenance payments disappear
- Mistaken overpayments cannot be refunded
- Next month's rent not auto-adjusted

### Fix Required
See **Section 9A** for complete Rent Ledger design with `creditBalance` field, monthly charge job, and payment allocation logic.

---

## 1. Tenant Addition Flow

### 1.1 Screens Involved
- **TenantFormScreen** (`/TenantForm`) - Add new tenant to a property
- **TenantDetailsScreen** (`/TenantDetails`) - View/edit tenant, record payments
- **TenantsScreen** (`/Tenants`) - List all tenants grouped by property

### 1.2 Required Fields (CreateTenantPayload)
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `fullName` | string | ≥ 2 chars | Tenant's full name |
| `fullAddress` | string | ≥ 5 chars | Residential address |
| `phone` | string | ≥ 8 digits | Auto-formatted to +91XXXXXXXXXX |
| `propertyId` | string | Required | From navigation params |
| `monthlyRent` | number | ≥ 0 | Monthly rent amount |
| `rentDueDay` | number | 1-31 | Day of month rent is due |
| `joinedOn` | string (YYYY-MM-DD) | Required | Tenant move-in date |
| `advanceAmount` | number | Optional, default 0 | Security deposit/advance |
| `openingDueAmount` | number | Optional, default 0 | Any pre-existing dues |

### 1.3 Validation Rules (Client-side)
```typescript
canSave = 
  tenantName.trim().length >= 2 &&
  tenantAddress.trim().length >= 5 &&
  tenantPhone.trim().length >= 8 &&
  Number(tenantRent) >= 0 &&
  Number(tenantRentDay) >= 1 &&
  Number(tenantRentDay) <= 31 &&
  tenantJoinedOn.trim().length > 0
```

### 1.4 Phone Number Normalization
- Input: `9876543210` → Stored as: `+919876543210`
- Input: `+919876543210` → Stored as: `+919876543210` (no double prefix)
- Input: `919876543210` → Stored as: `+919876543210`

### 1.5 API Endpoint
- **POST** `/api/tenants` → Creates tenant, returns normalized tenant object with `dueAmount` calculated by backend

---

## 2. Advance / Security Deposit Handling

### 2.1 Fields
| Field | Description | Default |
|-------|-------------|---------|
| `advanceAmount` | Security deposit collected at move-in | 0 |
| `openingDueAmount` | Any pre-existing dues at move-in | 0 |

### 2.2 Advance Behavior
- **Not deducted from rent** - Advance is held separately as security deposit
- **Displayed separately** in UI: "Advance Held: ₹X,XXX"
- **Does not reduce `dueAmount`** - Due amount tracks rent arrears only
- **Refundable** at tenant removal (manual process, not automated)

### 2.3 UI Display Locations
- **TenantDetailsScreen**: Card section shows "Advance Held" row
- **TenantsScreen**: Tenant card shows "Advance Held: ₹X,XXX"
- **Dashboard**: Not directly shown in summary (part of tenant detail)

---

## 3. Rent Due Calculation Logic

### 3.1 Core Concept
**`dueAmount`** = Total rent arrears owed by tenant (calculated on **backend**)

### 3.2 Backend Calculation (Server-side)
The `dueAmount` is computed by the backend API and returned in tenant object. Based on the data model and API behavior:

```
dueAmount = (Months elapsed since joinedOn × monthlyRent) 
            - Total payments received 
            + openingDueAmount
            - advanceAmount (NOT deducted - advance is separate)
```

**Key Points:**
- Advance (`advanceAmount`) is **NOT** subtracted from dueAmount
- `openingDueAmount` IS added to dueAmount (legacy dues)
- Payments reduce dueAmount
- Calculation is **monthly** based on `rentDueDay`

### 3.3 Frontend Display (Read-only)
The frontend **displays** `tenant.dueAmount` from API - **no local calculation** for the authoritative value.

**Exception**: Temporary optimistic update in TenantDetailsScreen after payment:
```typescript
// Temporary local update for instant UI feedback
updatedTenant = { 
  ...tenant, 
  dueAmount: Math.max(0, tenant.dueAmount - Number(paymentAmount)) 
};
```
This is replaced by server data after query invalidation.

### 3.4 Rent Cycle Logic
- **Due Day**: Configurable per tenant (1-31), stored as `rentDueDay`
- **Monthly Cycle**: Rent due on same day each month
- **Partial Months**: Backend handles proration based on `joinedOn`
- **Overdue**: If today > due day and payment not made, shows in pending

### 3.5 CollectionsScreen Aggregation
```typescript
// Total pending across all tenants
totalPending = tenants
  .filter(t => t.dueAmount > 0)
  .reduce((sum, t) => sum + t.dueAmount, 0)

// Total collected for selected month
totalCollected = payments
  .filter(p => p.paidMonth === selectedMonth) // or paidOn in month
  .reduce((sum, p) => sum + p.amount, 0)
```

---

## 4. Payment / Rent Collection Flow

### 4.1 Recording a Payment (Deposit)
**Screens**: TenantDetailsScreen → "Deposit" button, TenantsScreen → "Deposit" per tenant

### 4.2 Payment Input Fields
| Field | Type | Validation |
|-------|------|------------|
| `amount` | number | > 0 |
| `paidOn` | date (YYYY-MM-DD) | Required |
| `mode` | enum | UPI / CASH / BANK_TRANSFER / CARD |
| `notes` / `utr` | string | Optional (UTR reference) |

### 4.3 Payment Modes
- **UPI** - Default
- **CASH**
- **BANK_TRANSFER**
- **CARD**

### 4.4 API Endpoints
| Action | Endpoint | Payload |
|--------|----------|---------|
| Collect Rent | `POST /api/collections/collect` | `{ tenantId, amount, mode, paidOn, notes/utr }` |
| Update Payment | `PATCH /api/collections/payments/:id` | `{ amount, mode, paidOn, notes }` |
| Get Payments | `GET /api/collections/payments?tenantId=&month=` | Query params |

### 4.5 Payment Effect on Due Amount
1. Payment recorded via API
2. Backend recalculates `dueAmount` for tenant
3. Frontend invalidates queries: `tenants.list`, `collections.payments`, `dashboard.summary`
4. Fresh `dueAmount` fetched from server

---

## 5. Dashboard Summary Calculation

### 5.1 DashboardSummary Fields
| Field | Source | Description |
|-------|--------|-------------|
| `totalProperties` | Backend | Count of all properties |
| `occupiedProperties` | Backend | Properties with active tenant |
| `availableProperties` | Backend | `total - occupied` |
| `activeTenants` | Backend | Count of active tenants |
| `pendingDues` | Backend | **Sum of all tenant.dueAmount** |
| `monthCollection` | Backend | **Sum of payments in current month** |
| `openMaintenance` | Backend | Count of non-resolved maintenance |
| `monthExpenses` | Backend | Sum of resolved maintenance costs |

### 5.2 Key Metrics for QA
- **Pending Dues** = Σ tenant.dueAmount (all active tenants)
- **Month Collection** = Σ payments.amount (current calendar month)
- These are **server-calculated** - frontend only displays

---

## 6. Test Scenarios

### 6.1 Tenant Onboarding Scenarios

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1.1 | Add tenant with all required fields, advance=0, openingDue=0 | Tenant created, dueAmount = 0 (if joined today) or prorated |
| 1.2 | Add tenant with advanceAmount=50000 | Tenant created, advance shown separately, dueAmount unaffected by advance |
| 1.3 | Add tenant with openingDueAmount=10000 | Tenant created, dueAmount includes openingDue |
| 1.4 | Add tenant with both advance=50000 and openingDue=10000 | Advance shown separately, dueAmount includes openingDue only |
| 1.5 | Add tenant with joinedOn in past (e.g., 2 months ago) | dueAmount = 2 × monthlyRent (approx, backend prorates) |
| 1.6 | Add tenant with rentDueDay=15, joinedOn=1st of month | First full rent due on 15th of same month |
| 1.7 | Phone number formats: 9876543210, +919876543210, 919876543210 | All stored as +919876543210 |

### 6.2 Payment Collection Scenarios

| # | Scenario | Expected Result (CURRENT - BUGGY) | Expected Result (AFTER FIX) |
|---|----------|-----------------------------------|----------------------------|
| 2.1 | Record full rent payment (amount = monthlyRent) | dueAmount reduces by payment amount (to 0 if no arrears) | dueAmount reduces by payment amount |
| 2.2 | Record partial payment (amount < monthlyRent) | dueAmount reduces by partial amount | dueAmount reduces by partial amount |
| 2.3 | Record payment > dueAmount (overpayment) | **BUG: dueAmount = 0, excess LOST** | dueAmount = 0, **creditBalance = excess** |
| 2.4 | Record multiple payments in same month | dueAmount reduces cumulatively | dueAmount reduces cumulatively |
| 2.5 | Edit existing payment amount | dueAmount recalculates based on new total | Ledger recalculates, creditBalance adjusts |
| 2.6 | Payment with different modes (UPI, Cash, Bank, Card) | All accepted, mode stored with payment | All accepted, mode stored with payment |
| 2.7 | Overpayment carries to next month | **NOT SUPPORTED** | Next month rent auto-reduced by creditBalance |
| 2.8 | Tenant removal with credit balance | **NOT HANDLED** | Show refund amount in removal confirmation |

### 6.3 Dashboard Verification Scenarios

| # | Scenario | Expected Dashboard Update |
|---|----------|---------------------------|
| 3.1 | Add new tenant with rent due | `activeTenants` +1, `pendingDues` + dueAmount |
| 3.2 | Collect rent from tenant | `pendingDues` - amount, `monthCollection` + amount |
| 3.3 | Collect rent, navigate to Dashboard | Auto-refetches (refetchOnWindowFocus=true) |
| 3.4 | Remove tenant | `activeTenants` -1, `pendingDues` - tenant.dueAmount |
| 3.5 | Add property without tenant | `totalProperties` +1, `availableProperties` +1 |

### 6.4 Advance/Security Deposit Scenarios

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 4.1 | Tenant with advance=50000 pays rent | Advance unchanged, dueAmount reduces by rent |
| 4.2 | Tenant removed, advance refunded | Manual process - app shows advance held, no auto-refund |
| 4.3 | Advance edited via Edit Tenant | advanceAmount updates, dueAmount unaffected |

### 6.5 Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 5.1 | rentDueDay=31, month has 30 days | Backend handles (due on 30th or 1st next month) |
| 5.2 | joinedOn = future date | dueAmount = 0 until joinedOn passes |
| 5.3 | Monthly rent = 0 | Tenant tracked but no rent due |
| 5.4 | Multiple properties, tenants per property | Dashboard aggregates across all |
| 5.5 | Payment for past month (backdated) | Updates dueAmount, monthCollection for that month |

---

## 7. Data Flow Summary

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   TenantForm    │────▶│  POST /tenants   │────▶│  Backend Calc   │
│  (User Input)   │     │  (Create Tenant) │     │  dueAmount =    │
└─────────────────┘     └──────────────────┘     │  months × rent  │
                                                 │  - payments     │
                                                 │  + openingDue   │
                                                 └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Dashboard/     │◀────│  GET /tenants    │◀────│  Tenant Object  │
│  TenantDetails  │     │  (List/Detail)   │     │  {dueAmount,    │
└─────────────────┘     └──────────────────┘     │   advanceAmt,   │
                                                 │   openingDue}   │
                                                 └─────────────────┘
                                                          │
                    ┌──────────────────┐                 │
                    │  POST /collect   │◀────────────────┘
                    │  (Record Pay)    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Backend Recalc   │
                    │ dueAmount -= pay │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │ Invalidate      │           │ Dashboard       │
     │ Queries         │           │ Refetches       │
     │ (tenants,       │           │ (summary,       │
     │  payments,      │           │  pendingDues,   │
     │  dashboard)     │           │  monthCollection)│
     └─────────────────┘           └─────────────────┘
```

---

## 8. API Response Examples

### 8.1 Tenant Object (from GET /tenants)
```json
{
  "id": "tenant_123",
  "fullName": "John Doe",
  "fullAddress": "123 Main St, City",
  "phone": "+919876543210",
  "propertyId": "prop_456",
  "monthlyRent": 15000,
  "rentDueDay": 5,
  "joinedOn": "2024-01-15",
  "advanceAmount": 30000,
  "openingDueAmount": 0,
  "dueAmount": 15000,
  "status": "active",
  "kycVerified": false,
  "active": true
}
```

### 8.2 Payment Object (from GET /collections/payments)
```json
{
  "id": "pay_789",
  "tenantId": "tenant_123",
  "propertyId": "prop_456",
  "amount": 15000,
  "dueMonth": "2024-01",
  "paidMonth": "2024-01",
  "paidOn": "2024-01-03",
  "mode": "UPI",
  "utr": "UPI123456789",
  "notes": "Jan rent",
  "receiptNo": "RCP-2024-001"
}
```

### 8.3 Dashboard Summary (from GET /dashboard/summary)
```json
{
  "totalProperties": 5,
  "occupiedProperties": 3,
  "availableProperties": 2,
  "activeTenants": 3,
  "pendingDues": 45000,
  "monthCollection": 120000,
  "openMaintenance": 1,
  "monthExpenses": 15000
}
```

---

## 9. Key Backend Assumptions (For QA Reference)

> **Note**: These are inferred from frontend behavior and API contracts. Confirm with backend team.

1. **dueAmount Calculation**: Monthly rent × months elapsed - payments received + openingDue
2. **Month Boundary**: Based on calendar month, not 30-day rolling
3. **Proration**: First/last month prorated based on `joinedOn` and `rentDueDay`
4. **Advance Handling**: Never auto-deducted from rent; separate ledger
5. **Payment Allocation**: Applied to oldest due month first (FIFO)
6. **Month Collection**: Sum of payments where `paidOn` in current calendar month
7. **Pending Dues**: Sum of `dueAmount` for all active tenants

---

## 9A. ⚠️ CRITICAL BUG: Overpayment / Credit Balance Not Tracked

### Current Behavior (BUG)
```typescript
// Current frontend optimistic update (TenantDetailsScreen:116)
updatedTenant = { 
  ...tenant, 
  dueAmount: Math.max(0, tenant.dueAmount - Number(paymentAmount)) 
};
```

**Problem 1 - Data Loss**: When `paymentAmount > dueAmount`, the excess is **lost** - no credit balance stored.

**Problem 2 - UI Flicker / Ledger Inconsistency**: The `Math.max(0, ...)` clamp creates a temporary UI state that doesn't match the ledger.

| Due | Payment | Optimistic UI Shows | Backend Returns | User Sees |
|-----|---------|---------------------|-----------------|-----------|
| ₹500 | ₹700 | **₹0 due** (clamped) | due: ₹0, credit: ₹200 | **Flicker**: ₹0 → ₹0 + credit badge |

The optimistic update should **mirror the ledger model**, not clamp values:
```typescript
// CORRECT optimistic update (when ledger model exists)
const remainingDue = tenant.dueAmount - Number(paymentAmount);
const creditEarned = Math.max(0, -remainingDue);
updatedTenant = { 
  ...tenant, 
  dueAmount: Math.max(0, remainingDue),
  creditBalance: (tenant.creditBalance || 0) + creditEarned
};
```

**Never discard payment difference** - always track both `remainingDue` and `creditBalance` in optimistic state.

### Real-World Impact
| Scenario | Monthly Rent | Tenant Pays | Current Result | Correct Result |
|----------|-------------|-------------|----------------|----------------|
| Advance rent | ₹10,000 | ₹20,000 | Due: ₹0, **₹10,000 lost** | Due: ₹0, Credit: ₹10,000 |
| Extra maintenance | ₹10,000 | ₹12,000 | Due: ₹0, **₹2,000 lost** | Due: ₹0, Credit: ₹2,000 |
| Mistaken overpay | ₹10,000 | ₹15,000 | Due: ₹0, **₹5,000 lost** | Due: ₹0, Credit: ₹5,000 |

### Required Fix: Rent Ledger Model

**New Tenant Fields Needed:**
```typescript
// Add to Tenant model (src/types/models.ts)
creditBalance: number;           // Tracks overpayments
lastRentChargeMonth: string;     // Last month rent was charged (YYYY-MM)
```

**Ledger Calculation (Backend):**
```
Opening Balance (creditBalance carried forward)
+ Monthly Rent Charge (auto-generated each month on rentDueDay)
- Payments Received
- Credit Applied to Rent
= Closing Balance (new creditBalance)
```

**Rules:**
1. **NEVER clamp** `dueAmount` to 0 internally - allow negative = credit
2. `dueAmount` can be negative (represents credit balance)
3. Or split into two fields: `dueAmount` (≥0) + `creditBalance` (≥0)
4. Monthly rent charge job: runs daily, charges rent for tenants where due
5. Payment allocation: oldest due month first, then credit balance

### Test Scenarios for Credit Balance

| # | Scenario | Expected Result |
|---|----------|-----------------|
| CB-1 | Pay ₹12,000 when due ₹10,000 | dueAmount=0, creditBalance=2,000 |
| CB-2 | Next month rent ₹10,000 auto-charged | dueAmount=8,000 (10,000 - 2,000 credit), creditBalance=0 |
| CB-3 | Pay ₹5,000 when due ₹8,000 (credit=0) | dueAmount=3,000, creditBalance=0 |
| CB-4 | Pay ₹15,000 when due ₹3,000 | dueAmount=0, creditBalance=12,000 |
| CB-5 | Edit payment: reduce from ₹15,000 to ₹10,000 | Recalculate ledger, creditBalance adjusts |
| CB-6 | Tenant removed with creditBalance > 0 | Show refund amount in removal confirmation |
| CB-7 | Dashboard pendingDues | Sum of max(0, dueAmount) only (exclude credits) |
| CB-8 | Collections screen | Show credit balance column for tenants with credit |

### Test Scenarios for Optimistic Update Consistency

| # | Scenario | Current (Buggy) | Expected (Fixed) |
|---|----------|-----------------|------------------|
| OU-1 | Due ₹500, Pay ₹700 | UI shows ₹0 due, then flickers to credit | UI immediately shows ₹0 due + **₹200 credit badge** |
| OU-2 | Due ₹0, Pay ₹5,000 (advance) | UI shows ₹0 due, credit lost | UI immediately shows **₹5,000 credit badge** |
| OU-3 | Partial pay ₹3,000 of ₹5,000 due | UI shows ₹2,000 due ✓ | UI shows ₹2,000 due ✓ (already works) |
| OU-4 | Edit payment (reduce amount) | UI doesn't update optimistically | UI updates both due & credit optimistically |

---

## 9B. ⚠️ CRITICAL BUG: Proration Logic Undefined (Dangerous Ambiguity)

### The Problem
The document states "Backend handles proration based on `joinedOn`" but **no formula exists**. Different landlords expect different behavior:

**Scenario:** Tenant joins Sept 20, Rent = ₹30,000, Due Day = 1st
| Method | Due on Oct 1 | Logic |
|--------|--------------|-------|
| Full Month | ₹30,000 | Charge full month regardless of join date |
| Pro-rata (Daily) | ₹11,000 | (30,000/30) × 11 days = ₹11,000 |
| Skip Partial Month | ₹0 | First charge on next full cycle (Nov 1) |

### Impact
- **Financial disputes** between landlord/tenant
- **Inconsistent charges** across properties
- **Cannot automate** monthly rent charging job
- **Audit trail** shows no logic for amounts

### Required Fix: Property-Level Proration Setting

**Add to Property model** (`src/types/models.ts`):
```typescript
prorationMode: "full_month" | "pro_rata_daily" | "next_cycle";  // Default: "pro_rata_daily"
```

**Proration Formulas:**

| Mode | Formula | Example (Join: Sept 20, Rent: ₹30,000, Due: 1st) |
|------|---------|--------------------------------------------------|
| `full_month` | `monthlyRent` | ₹30,000 due Oct 1 |
| `pro_rata_daily` | `(monthlyRent / daysInMonth) × daysRemaining` | (30000/30) × 11 = ₹11,000 due Oct 1 |
| `next_cycle` | `0` (first charge next cycle) | ₹0 due Oct 1, first charge ₹30,000 on Nov 1 |

**Days Calculation for `pro_rata_daily`:**
```
daysRemaining = (daysInJoinedMonth - joinedOnDay + 1)  // inclusive of join day
// Sept 20 in 30-day month = 30 - 20 + 1 = 11 days
```

**Backend Monthly Charge Job Logic:**
```typescript
// For each tenant due this month:
if (isFirstMonth(tenant)) {
  switch (property.prorationMode) {
    case "full_month": charge = monthlyRent; break;
    case "pro_rata_daily": charge = calculateProrated(tenant, property); break;
    case "next_cycle": charge = 0; break;
  }
} else {
  charge = monthlyRent; // Full rent for subsequent months
}
dueAmount += charge;
```

### Test Scenarios for Proration

| # | Scenario | Full Month | Pro-Rata Daily | Next Cycle |
|---|----------|------------|----------------|------------|
| PR-1 | Join 1st, Due 1st | ₹30,000 | ₹30,000 | ₹30,000 |
| PR-2 | Join 15th (30-day), Due 1st | ₹30,000 | ₹16,000 | ₹0 |
| PR-3 | Join 20th (30-day), Due 1st | ₹30,000 | ₹11,000 | ₹0 |
| PR-4 | Join 28th (Feb 28), Due 1st | ₹30,000 | ₹2,143 | ₹0 |
| PR-5 | Join 31st (31-day), Due 1st | ₹30,000 | ₹968 | ₹0 |
| PR-6 | Join 1st, Due 15th | ₹30,000 | ₹30,000 | ₹0 (first charge 15th) |
| PR-7 | Join 20th, Due 15th | ₹30,000 | ₹11,000 | ₹0 |
| PR-8 | Leap year Feb 29 join | ₹30,000 | ₹1,000 | ₹0 |

### UI Required
- **PropertyFormScreen**: Add prorationMode dropdown
- **TenantFormScreen**: Show calculated first month amount preview
- **Dashboard/Collections**: Show proration mode in tenant details

### API Changes Required
| Endpoint | Change |
|----------|--------|
| `GET /tenants` | Return `creditBalance` field |
| `POST /collections/collect` | Accept overpayment, return updated creditBalance |
| `GET /dashboard/summary` | `pendingDues` = Σ max(0, dueAmount) |
| New: `POST /tenants/:id/credit-adjust` | Manual credit adjustment (refund, write-off) |

### Frontend Changes Required
1. **Tenant model** (`src/types/models.ts`): Add `creditBalance` field
2. **TenantDetailsScreen**: Show "Credit Balance" row when > 0
3. **Payment form**: Warn if payment > dueAmount (confirm overpayment)
4. **CollectionsScreen**: Add credit balance column
5. **Dashboard**: pendingDues excludes credit balances
6. **Remove tenant modal**: Show credit refund amount

---

## 10. Regression Checklist

After any changes to tenant/payment logic, verify:

- [ ] Tenant creation with all field combinations
- [ ] Advance amount displays correctly (separate from due)
- [ ] Opening due adds to dueAmount
- [ ] Payment reduces dueAmount immediately (optimistic) then confirms from server
- [ ] Dashboard pendingDues = sum of all tenant.dueAmount
- [ ] Dashboard monthCollection = sum of current month payments
- [ ] Query invalidation works: tenant list, payments, dashboard all refresh
- [ ] Edit tenant updates dueAmount correctly
- [ ] Remove tenant clears their dues from dashboard
- [ ] Phone normalization works for all input formats
- [ ] rentDueDay edge cases (28/29/30/31)

---

## 11. Files Reference

| Screen/Service | File Path |
|----------------|-----------|
| Tenant Form | `src/screens/TenantFormScreen.tsx` |
| Tenant Details | `src/screens/TenantDetailsScreen.tsx` |
| Tenants List | `src/screens/TenantsScreen.tsx` |
| Dashboard | `src/screens/DashboardScreen.tsx` |
| Collections | `src/screens/CollectionsScreen.tsx` |
| Tenant Service | `src/services/api/tenantService.ts` |
| Collection Service | `src/services/api/collectionService.ts` |
| Dashboard Service | `src/services/api/dashboardService.ts` |
| Query Keys | `src/services/api/queryKeys.ts` |
| Models | `src/types/models.ts` |

---

*Document Version: 1.0*  
*Last Updated: 2026-09-22*  
*App: RentOk*