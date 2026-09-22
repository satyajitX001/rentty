export type Property = {
  id: string;
  name: string;
  address: string;
  type?: "hostels" | "flat" | "villa";
  caretaker?: string;
  caretakerPhone?: string;
  occupancyStatus?: "available" | "occupied";
  active: boolean;
  totalBeds?: number;
  occupiedBeds?: number;
  prorationMode?: "full_month" | "pro_rata_daily" | "next_cycle";  // Default: "pro_rata_daily"
  graceDays?: number;
};

export type RentHistoryEntry = {
  effectiveFrom: string;  // YYYY-MM-DD
  monthlyRent: number;
};

export type LedgerEntryType =
  | "OPENING_BALANCE"
  | "RENT_CHARGE"
  | "PAYMENT"
  | "CREDIT_CREATED"
  | "CREDIT_APPLIED"
  | "ADVANCE_RECEIVED"
  | "ADVANCE_REFUND"
  | "ADVANCE_ADJUSTMENT"
  | "MAINTENANCE_CHARGE"
  | "LATE_FEE"
  | "RENT_REVISION";

export type LedgerEntry = {
  id: string;
  tenantId: string;
  propertyId: string;
  transactionType: LedgerEntryType;
  amount: number;
  effectiveDate: string;
  dueMonth?: string;
  paymentId?: string;
  notes?: string;
  runningBalance: number;
};

export type Tenant = {
  id: string;
  fullName: string;
  fullAddress?: string;
  phone: string;
  email?: string;
  propertyId: string;
  roomNumber?: string;
  monthlyRent: number;
  rentDueDay?: number;
  joinedOn?: string;
  advanceAmount?: number;
  openingDueAmount?: number;
  dueAmount: number;
  creditBalance: number;           // Tracks overpayments / credit carried forward (required, not optional)
  rentHistory?: RentHistoryEntry[];
  ledger?: LedgerEntry[];
  status: "active" | "notice" | "vacated" | "inactive";
  kycVerified: boolean;
  leaseStart?: string;
  leaseEnd?: string;
  vacatedOn?: string;
  vacateReason?: string;
  active?: boolean;
};

export type Payment = {
  id: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  dueMonth: string;
  paidMonth?: string;
  paidOn: string;
  mode: "UPI" | "CASH" | "BANK_TRANSFER" | "CARD";
  utr?: string;
  notes?: string;
  receiptNo?: string;
  allocations?: PaymentAllocation[];
};

export type PaymentAllocation = {
  month: string;
  amountApplied: number;
  type: "RENT_CHARGE" | "CREDIT_APPLIED" | "OPENING_BALANCE";
};

export type CollectPaymentResponse = {
  payment: Payment;
  receipt: {
    receiptNo: string;
    tenantName?: string;
    amount?: number;
    paidOn?: string;
    balanceDue: number;
    creditBalance: number;
  };
  allocations: PaymentAllocation[];
  ledgerEntries: Array<{
    type: LedgerEntryType;
    amount: number;
    runningBalance: number;
    dueMonth?: string;
  }>;
};

export type MaintenanceRequest = {
  id: string;
  propertyId: string;
  tenantId: string;
  roomNumber: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  servicedOn?: string;
  requestedOn: string;
  updatedOn: string;
  serviceProvider: string;
  estimatedCost: number;
};

export type Expense = {
  id: string;
  propertyId: string;
  category: "Electricity" | "Water" | "Repair" | "Cleaning" | "Internet";
  amount: number;
  paidBy: string;
  paidTo: string;
  spentOn: string;
  remarks: string;
  attachmentUrl?: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  requirements: string;
  tokenAmount: number;
  status: "new" | "site_visit" | "closed";
  propertyId: string;
};

export type DocumentItem = {
  id: string;
  entityType: "tenant" | "property" | "maintenance";
  entityId: string;
  title: string;
  fileType: "pdf" | "jpg" | "png";
  uploadedOn: string;
  tags: string[];
};

export type AlertItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "lease" | "payment" | "maintenance";
};

export type SupportTicket = {
  id: string;
  subject: string;
  priority: "low" | "medium" | "high";
  status: "open" | "resolved";
  createdOn: string;
};

export type ReportCard = {
  id: string;
  title: string;
  accent: string;
  icon: string;
  points: string[];
};

export type SettlementResult = {
  tenantId: string;
  tenantName: string;
  vacatedOn: string;
  outstandingRent: number;
  depositHeld: number;
  creditBalance: number;
  maintenanceCharges: number;
  damageCharges: number;
  refundAmount: number;
  settlementDetails: Array<{
    description: string;
    amount: number;
  }>;
};

export type DashboardSummary = {
  totalProperties: number;
  occupiedProperties?: number;
  availableProperties?: number;
  activeTenants: number;
  pendingDues: number;
  monthCollection: number;
  rentEarned: number;           // Rent charges generated in period
  totalCredit: number;          // Sum of all tenant credit balances
  totalDepositsHeld: number;    // Sum of all advanceAmount
  prepaidRent: number;          // Payments for future months
  outstandingVacatedDues: number; // Dues from vacated tenants
  openMaintenance: number;
  monthExpenses: number;
  occupiedBeds?: number;
  totalBeds?: number;
};
