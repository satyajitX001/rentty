import { ReportCard } from "../types/models";
import { ReportType } from "../services/api/reportService";

export type ReportCatalogItem = ReportCard & {
  reportType: ReportType;
};

export const reportCards: ReportCatalogItem[] = [
  {
    id: "rep-dues",
    reportType: "dues",
    title: "Dues Report",
    accent: "#2E7BFF",
    icon: "[bell]",
    points: ["Tenant & Room", "Unpaid Dues", "Dues Category", "Discounts", "Remarks"]
  },
  {
    id: "rep-complaint",
    reportType: "complaint",
    title: "Complaint Report",
    accent: "#E628C1",
    icon: "[alert]",
    points: ["Complaint Details", "Image", "Latest Status", "Tenant & Room"]
  },
  {
    id: "rep-tenant",
    reportType: "tenant",
    title: "Tenant Report",
    accent: "#00B96B",
    icon: "[tenant]",
    points: ["Tenant List", "KYC", "Unpaid Dues", "Remarks", "Collected Amount"]
  },
  {
    id: "rep-expense",
    reportType: "expense",
    title: "Expense Report",
    accent: "#FF4D3A",
    icon: "[expense]",
    points: ["Category", "Paid By/To", "Remarks", "Amount", "Attachments"]
  },
  {
    id: "rep-lead",
    reportType: "lead",
    title: "Lead Report",
    accent: "#8D39FF",
    icon: "[lead]",
    points: ["Lead Name", "Latest Status", "Token", "Contact", "Requirements"]
  },
  {
    id: "rep-collection",
    reportType: "collection",
    title: "Collection Report",
    accent: "#F4A620",
    icon: "[collection]",
    points: ["Collection Amount", "Date", "Tenant & Room", "UTR", "Mode"]
  }
];
