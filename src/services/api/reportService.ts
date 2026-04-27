import { API_BASE_URL } from "./config";
import { httpClient } from "./httpClient";

export type ReportType = "dues" | "complaint" | "tenant" | "expense" | "lead" | "collection";

export type GenerateReportPayload = {
  reportType: ReportType;
  from: string;
  to: string;
  format: "xlsx" | "pdf";
};

export type GenerateReportResponse = {
  reportId?: string;
  fileName?: string;
  downloadUrl?: string;
};

const toAbsoluteDownloadUrl = (downloadUrl?: string): string | undefined => {
  if (!downloadUrl) {
    return undefined;
  }
  if (/^https?:\/\//i.test(downloadUrl)) {
    return downloadUrl;
  }
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;
};

export async function generateReport(payload: GenerateReportPayload) {
  const response = await httpClient.post<GenerateReportResponse>("/reports/generate", payload);
  return {
    ...response,
    downloadUrl: toAbsoluteDownloadUrl(response.downloadUrl)
  };
}
