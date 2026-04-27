import { httpClient } from "./httpClient";

export type ReportType = "dues" | "complaint" | "tenant" | "expense" | "lead" | "collection";

export type GenerateReportPayload = {
  reportType: ReportType;
  from: string;
  to: string;
  format: "xlsx" | "csv";
};

export type GenerateReportResponse = {
  reportId?: string;
  fileName?: string;
  downloadUrl?: string;
};

export async function generateReport(payload: GenerateReportPayload) {
  return httpClient.post<GenerateReportResponse>("/reports/generate", payload);
}
