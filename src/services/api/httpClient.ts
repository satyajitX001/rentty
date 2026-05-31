import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from "axios";
import { API_BASE_URL } from "./config";
import { ApiEnvelope, ApiError, QueryParams } from "./types";
import { clearAuthTokens, getAccessToken, getRefreshToken, notifyAuthFailure, setAuthTokens } from "./tokenStore";
import { clearSessionStorage, updateSessionTokens } from "../../store/sessionStorage";

type HeaderRecord = Record<string, string>;

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const REFRESH_ENDPOINTS = ["/auth/refresh", "/auth/refresh-token"];

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000
});

let refreshPromise: Promise<TokenPair> | null = null;

function normalizeHeaders(headers?: unknown): HeaderRecord {
  if (!headers) return {};

  if (headers instanceof AxiosHeaders) {
    const json = headers.toJSON();
    return Object.entries(json).reduce<HeaderRecord>((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {});
  }

  if (typeof headers === "object") {
    return Object.entries(headers as Record<string, unknown>).reduce<HeaderRecord>((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      acc[key] = String(value);
      return acc;
    }, {});
  }

  return {};
}

function unwrapEnvelope<T>(response: AxiosResponse<ApiEnvelope<T> | T>) {
  const payload = response.data;

  if (typeof payload === "object" && payload !== null && !Array.isArray(payload) && "data" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data as T) ?? ({} as T);
  }

  return payload as T;
}

function extractRefreshTokens(payload: unknown, currentRefresh: string): TokenPair | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const source =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  const token =
    typeof source.token === "string"
      ? source.token
      : typeof source.accessToken === "string"
        ? source.accessToken
        : null;
  const refreshToken = typeof source.refreshToken === "string" ? source.refreshToken : currentRefresh;

  if (!token) return null;

  return {
    accessToken: token,
    refreshToken
  };
}

function isRefreshRequest(url?: string) {
  if (!url) return false;
  return REFRESH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

async function refreshAccessToken(currentRefresh: string): Promise<TokenPair> {
  for (const endpoint of REFRESH_ENDPOINTS) {
    try {
      const response = await refreshClient.post(endpoint, {
        refreshToken: currentRefresh
      });

      const tokens = extractRefreshTokens(response.data, currentRefresh);
      if (tokens) {
        return tokens;
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        continue;
      }

      throw error;
    }
  }

  throw new ApiError("Unable to refresh access token", 401);
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  const headers = normalizeHeaders(config.headers);
  headers.Accept = headers.Accept ?? "application/json";

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  config.headers = headers as any;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const messageFromServer =
      typeof error.response?.data === "object" && error.response?.data && "message" in error.response.data
        ? String((error.response.data as Record<string, unknown>).message)
        : null;

    const baseMessage = messageFromServer ?? error.message ?? "Request failed";
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest(originalRequest.url)) {
      const currentRefresh = getRefreshToken();

      if (!currentRefresh) {
        clearAuthTokens();
        await clearSessionStorage();
        notifyAuthFailure();
        return Promise.reject(new ApiError(baseMessage, status, error.response?.data));
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken(currentRefresh);
        }

        const tokens = await refreshPromise;
        setAuthTokens(tokens);
        await updateSessionTokens(tokens);

        originalRequest.headers = {
          ...normalizeHeaders(originalRequest.headers),
          Authorization: `Bearer ${tokens.accessToken}`
        } as any;

        return apiClient(originalRequest);
      } catch (refreshError) {
        const refreshAxiosError = refreshError as AxiosError;
        const refreshMessage = refreshAxiosError.message ?? "Session expired";

        clearAuthTokens();
        await clearSessionStorage();
        notifyAuthFailure();

        return Promise.reject(
          new ApiError(refreshMessage, refreshAxiosError.response?.status ?? 401, refreshAxiosError.response?.data)
        );
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(new ApiError(baseMessage, status, error.response?.data));
  }
);

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T> | T>(config);
  return unwrapEnvelope<T>(response);
}

export const httpClient = {
  get<T>(pathOrUrl: string, query?: QueryParams) {
    return request<T>({
      method: "GET",
      url: pathOrUrl,
      params: query
    });
  },

  post<T>(pathOrUrl: string, body?: unknown, query?: QueryParams) {
    return request<T>({
      method: "POST",
      url: pathOrUrl,
      data: body,
      params: query
    });
  },

  patch<T>(pathOrUrl: string, body?: unknown, query?: QueryParams) {
    return request<T>({
      method: "PATCH",
      url: pathOrUrl,
      data: body,
      params: query
    });
  },

  put<T>(pathOrUrl: string, body?: unknown, query?: QueryParams) {
    return request<T>({
      method: "PUT",
      url: pathOrUrl,
      data: body,
      params: query
    });
  },

  delete<T>(pathOrUrl: string, query?: QueryParams) {
    return request<T>({
      method: "DELETE",
      url: pathOrUrl,
      params: query
    });
  }
};
