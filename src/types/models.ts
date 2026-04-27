export type Property = {
  id: string;
  name: string;
  address: string;
  caretaker?: string;
  caretakerPhone?: string;
  occupancyStatus?: "available" | "occupied";
  active: boolean;
  totalBeds?: number;
  occupiedBeds?: number;
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

export type DashboardSummary = {
  totalProperties: number;
  occupiedProperties?: number;
  availableProperties?: number;
  activeTenants: number;
  pendingDues: number;
  monthCollection: number;
  openMaintenance: number;
  monthExpenses: number;
  occupiedBeds?: number;
  totalBeds?: number;
};
