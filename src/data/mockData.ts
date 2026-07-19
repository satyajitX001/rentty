import {
  AlertItem,
  DashboardSummary,
  DocumentItem,
  Expense,
  Lead,
  MaintenanceRequest,
  Payment,
  Property,
  ReportCard,
  SupportTicket,
  Tenant
} from "../types/models";

export const properties: Property[] = [
  {
    id: "prop-001",
    name: "Shanti Girls Hostel",
    address: "HSR Layout, Bengaluru",
    totalBeds: 72,
    occupiedBeds: 64,
    caretaker: "Anita Sharma",
    active: true
  },
  {
    id: "prop-002",
    name: "Metro Boys Residency",
    address: "Whitefield, Bengaluru",
    totalBeds: 96,
    occupiedBeds: 85,
    caretaker: "Rahul Verma",
    active: true
  }
];

export const tenants: Tenant[] = [
  {
    id: "ten-001",
    fullName: "Aarohi Mehta",
    phone: "+91-9000011111",
    email: "aarohi@example.com",
    propertyId: "prop-001",
    roomNumber: "G-104",
    leaseStart: "2025-07-01",
    leaseEnd: "2026-06-30",
    monthlyRent: 9500,
    dueAmount: 0,
    status: "active",
    kycVerified: true
  },
  {
    id: "ten-002",
    fullName: "Neha Kulkarni",
    phone: "+91-9000022222",
    email: "neha@example.com",
    propertyId: "prop-001",
    roomNumber: "G-118",
    leaseStart: "2025-11-10",
    leaseEnd: "2026-11-09",
    monthlyRent: 9800,
    dueAmount: 9800,
    status: "active",
    kycVerified: true
  },
  {
    id: "ten-003",
    fullName: "Rohan Iyer",
    phone: "+91-9000033333",
    email: "rohan@example.com",
    propertyId: "prop-002",
    roomNumber: "B-206",
    leaseStart: "2025-09-01",
    leaseEnd: "2026-08-31",
    monthlyRent: 8600,
    dueAmount: 4300,
    status: "active",
    kycVerified: false
  },
  {
    id: "ten-004",
    fullName: "Devansh Singh",
    phone: "+91-9000044444",
    email: "devansh@example.com",
    propertyId: "prop-002",
    roomNumber: "B-101",
    leaseStart: "2024-04-01",
    leaseEnd: "2026-04-30",
    monthlyRent: 9100,
    dueAmount: 0,
    status: "notice",
    kycVerified: true
  }
];

export const payments: Payment[] = [
  {
    id: "pay-001",
    tenantId: "ten-001",
    propertyId: "prop-001",
    amount: 9500,
    dueMonth: "2026-04",
    paidOn: "2026-04-05",
    mode: "UPI",
    utr: "UTR308771",
    notes: "Paid on-time"
  },
  {
    id: "pay-002",
    tenantId: "ten-004",
    propertyId: "prop-002",
    amount: 9100,
    dueMonth: "2026-04",
    paidOn: "2026-04-02",
    mode: "BANK_TRANSFER",
    utr: "UTR982214",
    notes: "Early rent payment"
  },
  {
    id: "pay-003",
    tenantId: "ten-003",
    propertyId: "prop-002",
    amount: 4300,
    dueMonth: "2026-04",
    paidOn: "2026-04-18",
    mode: "CASH",
    utr: "CASH-APR-22",
    notes: "Partially settled"
  }
];

export const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: "mnt-001",
    propertyId: "prop-001",
    tenantId: "ten-002",
    roomNumber: "G-118",
    title: "Bathroom tap leakage",
    description: "Continuous leak from washbasin tap.",
    priority: "medium",
    status: "open",
    requestedOn: "2026-04-23",
    updatedOn: "2026-04-23",
    serviceProvider: "Sri Plumbing Works",
    estimatedCost: 600
  },
  {
    id: "mnt-002",
    propertyId: "prop-002",
    tenantId: "ten-003",
    roomNumber: "B-206",
    title: "Wi-Fi not working",
    description: "No internet since last night.",
    priority: "high",
    status: "in_progress",
    requestedOn: "2026-04-24",
    updatedOn: "2026-04-25",
    serviceProvider: "SkyNet Internet Support",
    estimatedCost: 1200
  },
  {
    id: "mnt-003",
    propertyId: "prop-001",
    tenantId: "ten-001",
    roomNumber: "G-104",
    title: "Tube light replacement",
    description: "Room tube light flickers frequently.",
    priority: "low",
    status: "resolved",
    requestedOn: "2026-04-19",
    updatedOn: "2026-04-20",
    serviceProvider: "Bright Electricians",
    estimatedCost: 350
  }
];

export const expenses: Expense[] = [
  {
    id: "exp-001",
    propertyId: "prop-001",
    category: "Electricity",
    amount: 38200,
    paidBy: "Anita Sharma",
    paidTo: "BESCOM",
    spentOn: "2026-04-09",
    remarks: "Monthly utility bill",
    attachmentUrl: "https://example.com/bills/electricity-apr.pdf"
  },
  {
    id: "exp-002",
    propertyId: "prop-002",
    category: "Internet",
    amount: 9200,
    paidBy: "Rahul Verma",
    paidTo: "SkyNet Broadband",
    spentOn: "2026-04-04",
    remarks: "Quarterly broadband renewal"
  },
  {
    id: "exp-003",
    propertyId: "prop-002",
    category: "Repair",
    amount: 4600,
    paidBy: "Rahul Verma",
    paidTo: "Metro Maintenance Co",
    spentOn: "2026-04-17",
    remarks: "Water motor repair"
  }
];

export const leads: Lead[] = [
  {
    id: "lead-001",
    name: "Sanya Rao",
    phone: "+91-9000055555",
    requirements: "Double sharing, near ITPL",
    tokenAmount: 2000,
    status: "site_visit",
    propertyId: "prop-002"
  },
  {
    id: "lead-002",
    name: "Karthik Menon",
    phone: "+91-9000066666",
    requirements: "Single room with attached bathroom",
    tokenAmount: 0,
    status: "new",
    propertyId: "prop-001"
  }
];

export const documents: DocumentItem[] = [
  {
    id: "doc-001",
    entityType: "tenant",
    entityId: "ten-001",
    title: "Aarohi Lease Agreement",
    fileType: "pdf",
    uploadedOn: "2025-07-01",
    tags: ["lease", "kyc"]
  },
  {
    id: "doc-002",
    entityType: "property",
    entityId: "prop-001",
    title: "Fire Safety Certificate",
    fileType: "pdf",
    uploadedOn: "2026-01-14",
    tags: ["compliance"]
  },
  {
    id: "doc-003",
    entityType: "maintenance",
    entityId: "mnt-002",
    title: "Wi-Fi Complaint Photo",
    fileType: "jpg",
    uploadedOn: "2026-04-24",
    tags: ["complaint", "attachment"]
  }
];

export const alerts: AlertItem[] = [
  {
    id: "alr-001",
    title: "Rent Due Reminder",
    message: "Neha Kulkarni (G-118) has pending dues of INR 9,800.",
    date: "2026-04-26",
    type: "payment"
  },
  {
    id: "alr-002",
    title: "Lease Renewal",
    message: "Devansh Singh lease ends on 2026-04-30.",
    date: "2026-04-26",
    type: "lease"
  },
  {
    id: "alr-003",
    title: "Maintenance Follow-up",
    message: "Wi-Fi issue in B-206 still in progress.",
    date: "2026-04-25",
    type: "maintenance"
  }
];

export const supportTickets: SupportTicket[] = [
  {
    id: "sup-001",
    subject: "Need GST breakup in expense export",
    priority: "medium",
    status: "open",
    createdOn: "2026-04-20"
  },
  {
    id: "sup-002",
    subject: "Tenant KYC upload failed",
    priority: "high",
    status: "resolved",
    createdOn: "2026-04-11"
  }
];

export const reportCards: ReportCard[] = [
  {
    id: "rep-dues",
    title: "Dues Report",
    accent: "#2E7BFF",
    icon: "[bell]",
    points: ["Tenant & Room No.", "Unpaid Dues Amount", "Dues Category", "Active Discounts", "Remarks & Descriptions"]
  },
  {
    id: "rep-complaint",
    title: "Complaint Report",
    accent: "#E628C1",
    icon: "[alert]",
    points: ["Complaint Details", "Complaint image", "Latest Status", "Tenant & Room No."]
  },
  {
    id: "rep-tenant",
    title: "Tenant Report",
    accent: "#00B96B",
    icon: "[tenant]",
    points: ["List of Tenant & Rooms", "Tenant KYC Details", "Unpaid Dues", "Remarks & Descriptions", "Collected Amount"]
  },
  {
    id: "rep-expense",
    title: "Expense Report",
    accent: "#FF4D3A",
    icon: "[expense]",
    points: ["Expense Category", "Paid By & To", "Remarks & Descriptions", "Amount", "Attachments"]
  },
  {
    id: "rep-lead",
    title: "Lead Report",
    accent: "#8D39FF",
    icon: "[lead]",
    points: ["Lead Name", "Latest Status", "Token Amount", "Contact Details", "Requirements"]
  },
  {
    id: "rep-collection",
    title: "Collection Report",
    accent: "#F4A620",
    icon: "[collection]",
    points: ["Collection Amount", "Date & Time", "Tenant & Room No.", "UTR No.", "Payment Mode"]
  }
];

export const dashboardSummary: DashboardSummary = {
  totalProperties: properties.length,
  occupiedBeds: properties.reduce((sum, p) => sum + (p.occupiedBeds ?? 0), 0),
  totalBeds: properties.reduce((sum, p) => sum + (p.totalBeds ?? 0), 0),
  activeTenants: tenants.filter((t) => t.status === "active").length,
  pendingDues: tenants.reduce((sum, t) => sum + t.dueAmount, 0),
  monthCollection: payments.reduce((sum, p) => sum + p.amount, 0),
  openMaintenance: maintenanceRequests.filter((m) => m.status !== "resolved").length,
  monthExpenses: expenses.reduce((sum, e) => sum + e.amount, 0)
};



