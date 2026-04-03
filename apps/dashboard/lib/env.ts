/**
 * Validates required environment variables at runtime.
 * Throws an error with a clear message if any required variables are missing.
 */
export function validateEnv() {
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    errors.push("NEXT_PUBLIC_API_BASE_URL is required");
  }

  if (errors.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${errors.join("\n")}\n\nPlease check your .env.local file.`
    );
  }
}

/**
 * Gets the API base URL for the active dashboard.
 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!url) {
    throw new Error("API base URL is not configured");
  }
  return url;
}

export function getPostLoginOrigin(): string {
  return process.env.NEXT_PUBLIC_POST_LOGIN_ORIGIN ?? "";
}
