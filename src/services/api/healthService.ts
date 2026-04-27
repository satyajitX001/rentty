import { httpClient } from "./httpClient";
import { API_HEALTH_URL } from "./config";

export type HealthResponse = {
  status?: string;
  message?: string;
  uptime?: number;
  timestamp?: string;
};

export async function getHealth() {
  return httpClient.get<HealthResponse>(API_HEALTH_URL);
}
