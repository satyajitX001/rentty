export function toArray<T>(input: unknown, fallbackKeys: string[] = []): T[] {
  if (Array.isArray(input)) return input as T[];

  if (typeof input === "object" && input !== null) {
    const record = input as Record<string, unknown>;

    for (const key of fallbackKeys) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
}
