import { ApiError } from "../services/api/types";

function formatFieldName(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function readMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const message = source.message ?? source.msg ?? source.error;

  if (typeof message === "string" && message.trim()) {
    const field = source.field ?? source.path ?? source.param ?? source.name;
    return typeof field === "string" && field.trim()
      ? `${formatFieldName(field)}: ${message.trim()}`
      : message.trim();
  }

  return null;
}

function collectValidationMessages(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(collectValidationMessages);
  }

  const directMessage = readMessage(value);
  if (directMessage) {
    return [directMessage];
  }

  if (typeof value !== "object") {
    return [];
  }

  const source = value as Record<string, unknown>;
  const nestedKeys = ["errors", "details", "issues", "validationErrors"];
  const nestedMessages = nestedKeys.flatMap((key) => collectValidationMessages(source[key]));

  if (nestedMessages.length > 0) {
    return nestedMessages;
  }

  return Object.entries(source).flatMap(([key, entry]) => {
    if (key === "success" || key === "statusCode") return [];

    if (typeof entry === "string" && entry.trim()) {
      return [`${formatFieldName(key)}: ${entry.trim()}`];
    }

    if (Array.isArray(entry)) {
      const messages = entry
        .map(readMessage)
        .filter((message): message is string => Boolean(message));

      return messages.length > 0
        ? [`${formatFieldName(key)}: ${messages.join(", ")}`]
        : collectValidationMessages(entry);
    }

    return collectValidationMessages(entry);
  });
}

export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again later."
): string {
  if (error instanceof ApiError) {
    const validationMessages = collectValidationMessages(error.details);
    if ((error.status === 400 || error.status === 422) && validationMessages.length > 0) {
      return validationMessages.join("\n");
    }

    if (error.status === 401 || error.status === 403) {
      return "Your session expired. Please sign in again.";
    }

    if (error.status === 404) {
      return "We couldn't find what you requested. Please try again.";
    }

    if (error.status === 408 || error.status === 504) {
      return "The request took too long. Please try again.";
    }

    if (error.status >= 500) {
      return "Something went wrong on our end. Please try again later.";
    }

    if (error.status === 0) {
      return "Could not connect to the server. Check your internet and try again.";
    }

    return fallback;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      return "Could not connect to the server. Check your internet and try again.";
    }
  }

  return fallback;
}
