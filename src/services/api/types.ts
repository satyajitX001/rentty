export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;
