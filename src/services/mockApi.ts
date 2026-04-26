import {
  alerts,
  dashboardSummary,
  documents,
  expenses,
  leads,
  maintenanceRequests,
  payments,
  properties,
  reportCards,
  supportTickets,
  tenants
} from "../data/mockData";
import { MaintenanceRequest, Payment } from "../types/models";

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async getDashboard() {
    await wait();
    return dashboardSummary;
  },

  async getProperties() {
    await wait();
    return properties;
  },

  async getTenants() {
    await wait();
    return tenants;
  },

  async collectRent(input: {
    tenantId: string;
    amount: number;
    mode: Payment["mode"];
    notes?: string;
    paidOn: string;
  }) {
    await wait();
    const tenant = tenants.find((item) => item.id === input.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const nextDue = Math.max(tenant.dueAmount - input.amount, 0);
    tenant.dueAmount = nextDue;

    const payment: Payment = {
      id: `pay-${payments.length + 1}`,
      tenantId: input.tenantId,
      propertyId: tenant.propertyId,
      amount: input.amount,
      dueMonth: input.paidOn.slice(0, 7),
      paidOn: input.paidOn,
      mode: input.mode,
      utr: `UTR${Math.floor(100000 + Math.random() * 900000)}`,
      notes: input.notes ?? "Collected via app"
    };

    payments.unshift(payment);
    return {
      payment,
      receipt: {
        receiptNo: `REC-${Date.now()}`,
        tenantName: tenant.fullName,
        amount: input.amount,
        paidOn: input.paidOn,
        balanceDue: nextDue
      }
    };
  },

  async getPayments() {
    await wait();
    return payments;
  },

  async getMaintenanceRequests() {
    await wait();
    return maintenanceRequests;
  },

  async updateMaintenanceStatus(input: {
    requestId: string;
    status: MaintenanceRequest["status"];
  }) {
    await wait();
    const request = maintenanceRequests.find((item) => item.id === input.requestId);
    if (!request) {
      throw new Error("Maintenance request not found");
    }

    request.status = input.status;
    request.updatedOn = new Date().toISOString().slice(0, 10);
    return request;
  },

  async getExpenses() {
    await wait();
    return expenses;
  },

  async getLeads() {
    await wait();
    return leads;
  },

  async getDocuments() {
    await wait();
    return documents;
  },

  async getAlerts() {
    await wait();
    return alerts;
  },

  async getSupportTickets() {
    await wait();
    return supportTickets;
  },

  async getReportCards() {
    await wait();
    return reportCards;
  },

  async downloadReport(reportId: string) {
    await wait(400);
    const report = reportCards.find((item) => item.id === reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    return {
      reportId,
      fileName: `${report.title.replaceAll(" ", "-").toLowerCase()}-2026-04.xlsx`,
      status: "ready"
    };
  }
};
