import { useEffect, useState } from "react";
import { buildApiUrl, buildGoogleLoginUrl } from "./auth-flow";
import { getApiBaseUrl, getPostLoginOrigin } from "./env";
import type { SessionState, User } from "./types";

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

const DEV_USER: User = {
  name: "Dev User",
  email: "dev@tollgate.obul.ai",
  image: null
};

function normalizeUser(payload: any): User | null {
  if (!payload) return null;
  const candidate =
    payload.user ??
    payload.data?.user ??
    payload.session?.user ??
    payload.profile ??
    null;

  const source = candidate && typeof candidate === "object" ? candidate : payload;
  const email = source?.email ?? source?.mail ?? null;
  const name = source?.name ?? source?.displayName ?? null;
  const image = source?.image ?? source?.avatar ?? source?.picture ?? null;

  if (!email && !name && !image) return null;
  return { email, name, image };
}

export function startGoogleLogin(flow?: string) {
  if (DEV_BYPASS_AUTH && typeof window !== "undefined") {
    window.location.href = "/dashboard";
    return;
  }
  if (typeof window === "undefined") {
    throw new Error("Google login can only start in the browser");
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  window.location.href = buildGoogleLoginUrl(
    baseUrl,
    window.location.origin,
    flow,
    getPostLoginOrigin()
  );
}

export async function signOut() {
  if (DEV_BYPASS_AUTH) return;
  let baseUrl: string;
  try {
    baseUrl = getApiBaseUrl();
  } catch {
    return;
  }
  await fetch(buildApiUrl(baseUrl, "/auth/logout"), {
    method: "POST",
    credentials: "include"
  });
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    data: DEV_BYPASS_AUTH ? { user: DEV_USER, raw: { source: "dev-bypass" } } : null,
    isPending: !DEV_BYPASS_AUTH,
    error: null
  });

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      return;
    }
    let active = true;

    setState((prev) => ({
      data: prev.data,
      isPending: true,
      error: null
    }));

    const loadSession = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        if (!baseUrl) {
          throw new Error("Missing API base URL");
        }

        const response = await fetch(buildApiUrl(baseUrl, "/auth/session"), {
          method: "GET",
          credentials: "include"
        });

        if (response.status === 401 || response.status === 403) {
          if (active) {
            setState({ data: null, isPending: false, error: null });
          }
          return;
        }

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load session");
        }

        const payload = (await response.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const user = normalizeUser(payload);
        const data = user ? { user, raw: payload } : null;

        if (active) {
          setState({ data, isPending: false, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            data: null,
            isPending: false,
            error: error instanceof Error ? error : new Error("Session error")
          });
        }
      }
    };

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
