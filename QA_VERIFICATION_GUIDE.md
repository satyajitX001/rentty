# RentOk v1.1 — QA Verification Guide

## Financial Architecture Overview

**Single Source of Truth**: Immutable `RentLedger` collection with 11 transaction types
- Positive amounts = charges to tenant (increase outstanding)
- Negative amounts = payments/credits (decrease outstanding)
- Running balance after each entry = current state

**Key Principle**: `dueAmount` is now **derived** from ledger, not stored.

---

## 1. Ledger Transaction Types & Calculations

| Type | Amount Sign | Purpose | Running Balance Effect |
|------|-------------|---------|------------------------|
| `OPENING_BALANCE` | + | Initial dues on tenant creation | Increases outstanding |
| `RENT_CHARGE` | + | Monthly rent charge (cron) | Increases outstanding |
| `PAYMENT` | - | Tenant payment received | Decreases outstanding |
| `CREDIT_CREATED` | + | Overpayment creates credit | Increases credit (negative balance) |
| `CREDIT_APPLIED` | - | Auto-applied credit to rent charge | Decreases credit |
| `ADVANCE_RECEIVED` | + | Security deposit received | Tracks deposit separately |
| `ADVANCE_REFUND` | - | Deposit refunded | Reduces deposit held |
| `ADVANCE_ADJUSTMENT` | +/- | Deposit adjusted against dues | Moves between deposit/due |
| `MAINTENANCE_CHARGE` | + | Maintenance charges | Increases outstanding |
| `LATE_FEE` | + | Late payment penalty | Increases outstanding |
| `RENT_REVISION` | +/- | Rent increase/decrease adjustment | Adjusts future charges |

---

## 2. Core Calculation Algorithms

### 2.1 FIFO Payment Allocation (recordPaymentWithLedger)

```typescript
// Input: paymentAmount, tenantId, effectiveDate
// Process:
1. Fetch all outstanding RENT_CHARGE entries (runningBalance > 0)
   Sorted by effectiveDate ASC (oldest first)

2. For each charge:
   allocatable = min(remainingPayment, charge.runningBalance)
   Create PAYMENT entry: amount = -allocatable
   Create CREDIT_APPLIED if credit was used
   remainingPayment -= allocatable

3. If remainingPayment > 0:
   Create CREDIT_CREATED entry: amount = +remainingPayment
   Update tenant.creditBalance = remainingPayment

4. Return allocations[] + ledgerEntries[]
```

**Example**: Rent ₹8,000/month. Outstanding: Jul(₹8k), Aug(₹8k), Sep(₹8k). Payment: ₹10,000
- Jul: PAYMENT -8,000 (cleared)
- Aug: PAYMENT -2,000 (partial)
- Sep: unchanged
- Result: allocations = [{month: "2026-07", amount: 8000}, {month: "2026-08", amount: 2000}]

### 2.2 Monthly Rent Charge Generation (generateMonthlyRentCharges)

```typescript
// Runs 1st of each month (cron)
For each active tenant:
  1. Calculate dueDate from rentDueDay (handle 28/29/30/31 with month-end clamp)
  2. If dueDate <= asOfDate:
     Create RENT_CHARGE: amount = monthlyRent, dueMonth = "YYYY-MM"
     
     // AUTO-CREDIT APPLICATION
     If tenant.creditBalance > 0:
       applyAmount = min(creditBalance, monthlyRent)
       Create CREDIT_APPLIED: amount = -applyAmount
       Create RENT_CHARGE for remainder: amount = monthlyRent - applyAmount
       tenant.creditBalance -= applyAmount
     Else:
       Create RENT_CHARGE: amount = monthlyRent
     
     Update tenant.dueAmount from ledger
```

### 2.3 Credit Auto-Application

Triggered when `RENT_CHARGE` is created (cron or manual):
```typescript
async applyCreditFIFO(tenantId, asOfDate):
  credit = await getTenantCredit(tenantId)
  if credit <= 0: return
  
  charges = getOutstandingRentCharges(tenantId, asOfDate)
  for charge in charges (oldest first):
    apply = min(credit, charge.runningBalance)
    if apply > 0:
      create CREDIT_APPLIED entry
      credit -= apply
    if credit <= 0: break
  
  update tenant.creditBalance
```

### 2.4 Proration Calculation (First Month Rent)

**Property.prorationMode** determines calculation:

| Mode | Formula | Example: Join Sep 20, Rent ₹30,000, Due Day 1 |
|------|---------|-----------------------------------------------|
| `FULL_MONTH` | monthlyRent | ₹30,000 |
| `PRO_RATA_DAILY` | (monthlyRent ÷ daysInMonth) × daysRemaining | (30000/30) × 11 = ₹11,000 |
| `NEXT_CYCLE` | 0 (first charge next due date) | ₹0 |

**Days Remaining Calculation**:
- Due day = 1: days from join date to end of month
- Due day = 15: if join before 15th, full month; else pro-rata to next cycle
- Month-end clamp: Feb 28/29, Apr/Jun/Sep/Nov 30, others 31

### 2.5 Grace Days & Late Fee

```typescript
dueDate = calculateDueDate(tenant.rentDueDay, month)
graceEndDate = dueDate + property.graceDays
if paymentDate > graceEndDate:
  lateFee = calculateLateFee(property, daysLate)
  create LATE_FEE entry
```

### 2.6 Move-Out Settlement (calculateSettlement)

```typescript
Input: tenantId, vacatedOn

Output: SettlementResult
{
  outstandingRent: sum of positive runningBalance RENT_CHARGE entries
  depositHeld: sum of ADVANCE_RECEIVED - ADVANCE_REFUND - ADVANCE_ADJUSTMENT
  creditBalance: tenant.creditBalance (from ledger or tenant model)
  maintenanceCharges: sum of MAINTENANCE_CHARGE entries
  damageCharges: manual input or separate tracking
  refundAmount: depositHeld + creditBalance - outstandingRent - maintenanceCharges - damageCharges
  
  settlementDetails: [
    { description: "Outstanding Rent (Jul-Sep)", amount: -24000 },
    { description: "Security Deposit", amount: +50000 },
    { description: "Credit Balance", amount: +5000 },
    { description: "Maintenance Charges", amount: -2000 },
    { description: "Damage Charges", amount: -3000 },
    { description: "Net Refund", amount: +26000 }
  ]
}
```

---

## 3. Dashboard Metrics Calculation

### getSummary() — Ledger-Based

| Metric | Source | Formula |
|--------|--------|---------|
| `monthCollection` | Payments collection | Σ payments.amount (paid in current month) |
| `rentEarned` | Ledger | Σ RENT_CHARGE.amount (effectiveDate in current month) |
| `totalCredit` | Tenant model | Σ tenant.creditBalance (all active tenants) |
| `totalDepositsHeld` | Tenant model | Σ tenant.advanceAmount (all tenants) |
| `prepaidRent` | Ledger | Σ PAYMENT.amount where dueMonth > currentMonth |
| `outstandingVacatedDues` | Ledger | Σ outstanding for tenants with status=vacated |
| `pendingDues` | Ledger | Σ outstanding for active tenants |

**Critical Distinction**:
- `monthCollection` = **Cash Flow** (money in bank)
- `rentEarned` = **Accrual Revenue** (rent charges generated)
- These diverge when credits exist or payments are for future months

---

## 4. Test Cases for QA Verification

### 4.1 Credit Balance & Overpayment (BUG-01, BUG-02)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-01 | Rent ₹10,000, Due ₹8,000, Pay ₹12,000 | Due ₹0, Credit ₹4,000, allocation: 8000 to current month |
| TC-02 | Existing credit ₹4,000, next month rent ₹10,000 generated | Credit ₹0, Due ₹6,000, CREDIT_APPLIED entry created |
| TC-03 | Credit ₹5,000, Pay ₹3,000 (partial) | Credit ₹2,000, no new charge |
| TC-04 | Credit persists after app restart | Credit balance survives (stored in tenant.creditBalance + ledger) |

### 4.2 FIFO Allocation (BUG-03, BUG-04)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-05 | Outstanding: Jul ₹8k, Aug ₹8k, Sep ₹8k. Pay ₹10k | Jul: 8k cleared, Aug: 2k partial, Sep: 0k. 2 allocations returned |
| TC-06 | Pay exact total outstanding | All months cleared, credit = 0 |
| TC-07 | Pay more than total outstanding | All cleared, credit created for excess |

### 4.3 Due Day Edge Cases (BUG-05, BUG-06)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-08 | Due day 31, month has 30 days | Due date = 30th (month-end clamp) |
| TC-09 | Due day 29, non-leap Feb | Due date = 28th |
| TC-10 | Due day 29, leap Feb (2024) | Due date = 29th |
| TC-11 | Due day 30, Feb | Due date = 28th/29th |

### 4.4 Proration Modes (BUG-07, BUG-08)

| Test ID | Property Mode | Join Date | Due Day | Monthly Rent | Expected First Charge |
|---------|---------------|-----------|---------|--------------|----------------------|
| TC-12 | `FULL_MONTH` | Sep 20 | 1 | ₹30,000 | ₹30,000 |
| TC-13 | `PRO_RATA_DAILY` | Sep 20 | 1 | ₹30,000 | ₹11,000 (11 days × ₹1,000) |
| TC-14 | `NEXT_CYCLE` | Sep 20 | 1 | ₹30,000 | ₹0 (first charge Oct 1) |
| TC-15 | `PRO_RATA_DAILY` | Sep 15 | 15 | ₹30,000 | ₹15,000 (15 days) |
| TC-16 | `PRO_RATA_DAILY` | Sep 16 | 15 | ₹30,000 | ₹0 (next cycle Oct 15) |

### 4.5 Rent History / Revision (BUG-09, BUG-10)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-17 | Rent increase from ₹10k to ₹12k effective Oct 1 | Sep charge ₹10k, Oct charge ₹12k, RENT_REVISION entry |
| TC-18 | Historical charges never change after revision | Past ledger entries immutable |
| TC-19 | Multiple revisions tracked | rentHistory array has all effectiveFrom + monthlyRent |

### 4.6 Deposit Ledger (BUG-11, BUG-12)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-20 | Tenant onboarded with advance ₹50,000 | ADVANCE_RECEIVED entry, depositHeld = 50,000 |
| TC-21 | Move-out: deposit adjusted against dues | ADVANCE_ADJUSTMENT entry, depositHeld reduced |
| TC-22 | Refund processed | ADVANCE_REFUND entry, depositHeld = 0 |

### 4.7 Move-Out Settlement (BUG-13, BUG-14)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-23 | Outstanding ₹15k, Deposit ₹50k, Credit ₹5k, No damages | Refund = 50+5-15 = ₹40k |
| TC-24 | Outstanding ₹20k, Deposit ₹15k, Credit ₹0 | Refund = 15-20 = -₹5k (tenant owes) |
| TC-25 | Settlement preview in remove modal matches final | Preview = actual settlement |

### 4.8 Dashboard Metrics Separation (BUG-15, BUG-16)

| Test ID | Scenario | monthCollection | rentEarned | totalCredit |
|---------|----------|-----------------|------------|-------------|
| TC-26 | No credits, on-time payments | ₹1,00,000 | ₹1,00,000 | ₹0 |
| TC-27 | Tenant overpaid ₹10k (credit) | ₹1,10,000 | ₹1,00,000 | ₹10,000 |
| TC-28 | Payment for next month received early | ₹1,10,000 | ₹1,00,000 | prepaidRent = ₹10k |

### 4.9 Opening Due Breakdown (BUG-17, BUG-18)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-29 | New tenant with openingDueAmount ₹25,000 | OPENING_BALANCE entry created, monthly breakdown in ledger |
| TC-30 | Opening due paid partially | Allocations show which months cleared |

### 4.10 Optimistic UI & Backend Sync (BUG-19, BUG-20)

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-31 | Record payment → UI updates immediately | Due/Credit match backend response exactly |
| TC-32 | Network error → rollback | UI reverts to pre-payment state |
| TC-33 | Concurrent payments | Last-write-wins with React Query invalidation |

---

## 5. API Response Verification

### Collect Payment Response (`POST /collections/collect`)

```json
{
  "payment": { "id": "...", "amount": 10000, "paidOn": "2026-09-15", ... },
  "receipt": {
    "receiptNo": "RCPT-001",
    "balanceDue": 6000,
    "creditBalance": 0
  },
  "allocations": [
    { "month": "2026-07", "amountApplied": 8000, "type": "RENT_CHARGE" },
    { "month": "2026-08", "amountApplied": 2000, "type": "RENT_CHARGE" }
  ],
  "ledgerEntries": [
    { "type": "PAYMENT", "amount": -10000, "runningBalance": 6000, "dueMonth": "2026-08" },
    { "type": "CREDIT_CREATED", "amount": 0, "runningBalance": 6000 }
  ]
}
```

**Verify**: `receipt.balanceDue` + `receipt.creditBalance` = new tenant state

### Tenant Ledger Response (`GET /tenants/:id/ledger`)

```json
[
  { "type": "OPENING_BALANCE", "amount": 5000, "runningBalance": 5000, "effectiveDate": "2026-01-01" },
  { "type": "RENT_CHARGE", "amount": 10000, "runningBalance": 15000, "dueMonth": "2026-01" },
  { "type": "PAYMENT", "amount": -12000, "runningBalance": 3000, "effectiveDate": "2026-01-10" },
  { "type": "CREDIT_CREATED", "amount": 2000, "runningBalance": 5000, "effectiveDate": "2026-01-10" }
]
```

**Verify**: Last entry `runningBalance` = `tenant.dueAmount` (if positive) or `tenant.creditBalance` (if negative)

### Settlement Response (`POST /tenants/:id/settlement`)

```json
{
  "tenantId": "ten-001",
  "tenantName": "John Doe",
  "vacatedOn": "2026-09-30",
  "outstandingRent": 15000,
  "depositHeld": 50000,
  "creditBalance": 5000,
  "maintenanceCharges": 2000,
  "damageCharges": 3000,
  "refundAmount": 35000,
  "settlementDetails": [
    { "description": "Outstanding Rent (Jul-Sep)", "amount": -15000 },
    { "description": "Security Deposit", "amount": 50000 },
    { "description": "Credit Balance", "amount": 5000 },
    { "description": "Maintenance Charges", "amount": -2000 },
    { "description": "Damage Charges", "amount": -3000 }
  ]
}
```

**Verify**: `refundAmount = depositHeld + creditBalance - outstandingRent - maintenanceCharges - damageCharges`

---

## 6. Frontend Verification Checklist

### CollectionsScreen
- [ ] Pending tenants show credit badge when `creditBalance > 0`
- [ ] Payment ledger shows allocation breakdown per payment
- [ ] Month picker navigation works

### TenantDetailsScreen
- [ ] Financial Summary Card shows: Monthly Rent, Outstanding Due, Available Credit, Deposit Held, Opening Balance
- [ ] Next Due Date & Grace Ends On calculated correctly
- [ ] "Use Available Credit Automatically" checkbox appears when credit > 0 AND due > 0
- [ ] Record Collection uses backend allocation response for optimistic update
- [ ] Remove Tenant modal shows credit refund info
- [ ] Settlement Preview button fetches and displays breakdown

### TenantsScreen
- [ ] Tenant cards show "Credit: +₹X" badge when applicable
- [ ] Remove modal shows credit refund amount

### PropertyActionsScreen
- [ ] Property Status shows credit balance
- [ ] Remove Tenant modal has "Preview Settlement" button
- [ ] Settlement preview matches backend calculation

### DashboardScreen
- [ ] Money Flow chart: 5 bars (Collected, Earned, Pending, Credit, Expenses)
- [ ] Metric cards show: Rent Earned, Total Credit, Total Deposits, Prepaid Rent, Outstanding Vacated
- [ ] `monthCollection` ≠ `rentEarned` when credits exist

### PropertyFormScreen
- [ ] Proration Mode selector (3 options) with descriptions
- [ ] Grace Days numeric input
- [ ] Values persist on save

---

## 7. Backend Verification Commands

```bash
# 1. Compile check
cd rentok-backend && npm install && npx tsc --noEmit

# 2. Run unit tests (when available)
npm test

# 3. Manual API tests via curl
# Collect payment
curl -X POST http://localhost:3000/api/collections/collect \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"ten-001","amount":12000,"mode":"UPI","paidOn":"2026-09-15","notes":"Test overpayment"}'

# Get ledger
curl http://localhost:3000/api/tenants/ten-001/ledger

# Get settlement preview
curl -X POST http://localhost:3000/api/tenants/ten-001/settlement \
  -H "Content-Type: application/json" \
  -d '{"vacatedOn":"2026-09-30"}'

# Dashboard summary
curl http://localhost:3000/api/dashboard/summary
```

---

## 8. Data Integrity Invariants

**Must Always Hold True**:

1. **Ledger Balance Invariant**: For any tenant, last ledger entry `runningBalance` = `tenant.dueAmount` (if ≥0) or `-tenant.creditBalance` (if <0)

2. **Credit Conservation**: `Σ CREDIT_CREATED.amount = Σ CREDIT_APPLIED.amount + tenant.creditBalance`

3. **Deposit Conservation**: `Σ ADVANCE_RECEIVED = Σ ADVANCE_REFUND + Σ ADVANCE_ADJUSTMENT + tenant.advanceAmount`

4. **Payment Allocation Sum**: `Σ allocations[].amountApplied = payment.amount`

5. **Rent Earned = Σ RENT_CHARGE.amount** for period (not affected by payments)

6. **Immutability**: No ledger entry can be modified after creation (only new entries added)

---

## 9. Migration/Backfill Verification (Optional)

If running backfill script:
- [ ] Each tenant gets OPENING_BALANCE if openingDueAmount > 0
- [ ] Each tenant gets ADVANCE_RECEIVED if advanceAmount > 0
- [ ] All historical payments replayed as PAYMENT entries
- [ ] Historical RENT_CHARGE entries generated for past months
- [ ] Running balance computed and matches current dueAmount
- [ ] Idempotent: running twice produces same result

---

## 10. Known Limitations / Future Work

| Item | Status | Notes |
|------|--------|-------|
| Late fee automation | Manual | LATE_FEE entries created manually or via separate cron |
| Damage charges tracking | Manual | Separate module needed for inspection photos/quotes |
| Recurring maintenance charges | Not implemented | Could extend ledger with RECURRING_CHARGE type |
| Multi-currency | Not supported | INR only |
| Audit log for manual adjustments | Partial | Ledger itself is audit trail; admin actions logged separately |

---

## 11. Quick Smoke Test Script

```bash
# Run after deployment
echo "=== SMOKE TEST ==="

# 1. Create tenant with advance
# 2. Generate rent charge (cron or manual)
# 3. Overpay by 20%
# 4. Verify credit created
# 5. Next month: verify credit auto-applied
# 6. Record partial payment
# 7. Verify FIFO allocation
# 8. Preview settlement
# 9. Remove tenant → verify refund calc
# 10. Check dashboard: collected vs earned vs credit
```

---

*Document Version: 1.0*  
*Generated for RentOk v1.1 Ledger-Based Financial Architecture*  
*Last Updated: 2026-09-23*