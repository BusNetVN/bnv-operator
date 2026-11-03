import type { z } from "zod";

/** First message of each invalid field, to show under its input. */
export function firstFieldErrors<T>(error: z.ZodError<T>) {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T | undefined;
    if (field !== undefined && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
