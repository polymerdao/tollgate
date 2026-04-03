export const AUTH_CALLBACK_PATH = "/auth/callback";
export const AUTH_SUCCESS_PATH = "/dashboard";
export const AUTH_RETRY_PATH = "/login";
export const AUTH_FLOW_QUERY_PARAM = "flow";
export const AUTH_FLOW_DEVICE = "device";
export const PRIMARY_DASHBOARD_ORIGIN = "https://tollgate.obul.ai";

const RETURN_TO_KEY = "tollgate_auth_return_to";
const RETURN_TO_TTL_MS = 10 * 60 * 1000;

type AuthReturnToPayload = {
  path: string;
  flow?: string;
  createdAt: number;
};

function normalizeInternalPath(path: string): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }
  return path;
}

export function setAuthReturnTo(path: string, flow?: string): void {
  if (typeof window === "undefined") return;
  const normalizedPath = normalizeInternalPath(path);
  if (!normalizedPath) return;
  const payload: AuthReturnToPayload = {
    path: normalizedPath,
    createdAt: Date.now(),
    ...(flow ? { flow } : {})
  };
  sessionStorage.setItem(RETURN_TO_KEY, JSON.stringify(payload));
}

export function consumeAuthReturnTo(expectedFlow?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  if (!value) return null;

  let payload: AuthReturnToPayload;
  try {
    payload = JSON.parse(value) as AuthReturnToPayload;
  } catch {
    return null;
  }

  const normalizedPath = normalizeInternalPath(payload.path);
  if (!normalizedPath) return null;
  if (typeof payload.createdAt !== "number") return null;
  if (Date.now() - payload.createdAt > RETURN_TO_TTL_MS) return null;
  if (expectedFlow && payload.flow !== expectedFlow) return null;
  if (!expectedFlow && payload.flow) return null;
  return normalizedPath;
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function isPreviewOrLocalhostHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".pages.dev")
  );
}

function normalizeOrigin(value?: string): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[auth-flow] Ignoring invalid post-login origin: ${value}`);
    }
    return null;
  }
}

export function resolvePostLoginOrigin(
  currentOrigin: string,
  preferredOrigin?: string
): string {
  const current = new URL(currentOrigin);
  if (isPreviewOrLocalhostHost(current.hostname)) {
    return current.origin;
  }

  const preferred = normalizeOrigin(preferredOrigin);
  if (preferred) {
    return preferred;
  }

  return current.origin;
}

export function buildApiUrl(apiBaseUrl: string, path: string): string {
  const normalizedBase = trimTrailingSlashes(apiBaseUrl.trim());
  if (!normalizedBase) {
    throw new Error("API base URL is not configured");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function buildAuthCallbackUrl(
  currentOrigin: string,
  flow?: string,
  preferredPostLoginOrigin?: string
): string {
  const callbackOrigin = flow === AUTH_FLOW_DEVICE
    ? new URL(currentOrigin).origin
    : resolvePostLoginOrigin(currentOrigin, preferredPostLoginOrigin);
  const callbackUrl = new URL(AUTH_CALLBACK_PATH, callbackOrigin);
  if (flow) {
    callbackUrl.searchParams.set(AUTH_FLOW_QUERY_PARAM, flow);
  }
  return callbackUrl.toString();
}

export function buildDashboardUrl(
  currentOrigin: string,
  preferredPostLoginOrigin?: string
): string {
  const dashboardOrigin = resolvePostLoginOrigin(currentOrigin, preferredPostLoginOrigin);
  return new URL(AUTH_SUCCESS_PATH, dashboardOrigin).toString();
}

export function buildGoogleLoginUrl(
  apiBaseUrl: string,
  currentOrigin: string,
  flow?: string,
  preferredPostLoginOrigin?: string
): string {
  const callbackUrl = buildAuthCallbackUrl(
    currentOrigin,
    flow,
    preferredPostLoginOrigin
  );
  const loginUrl = new URL(buildApiUrl(apiBaseUrl, "/auth/google/login"));
  loginUrl.searchParams.set("return_to", callbackUrl);
  return loginUrl.toString();
}

export type AuthCallbackOutcome =
  | { kind: "loading" }
  | { kind: "redirect"; path: string }
  | { kind: "retry"; path: string };

export function getAuthCallbackOutcome(
  isPending: boolean,
  hasAuthenticatedUser: boolean,
  returnTo?: string | null
): AuthCallbackOutcome {
  if (isPending) {
    return { kind: "loading" };
  }

  if (hasAuthenticatedUser) {
    const path = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : AUTH_SUCCESS_PATH;
    return { kind: "redirect", path };
  }

  return { kind: "retry", path: AUTH_RETRY_PATH };
}
