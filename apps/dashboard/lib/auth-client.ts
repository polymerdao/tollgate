"use client";

import { useEffect, useState } from "react";
import type { SessionState, User } from "./types";

export function startGoogleLogin(): void {
  window.location.href = "/api/auth/login";
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    data: null,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          if (active) setState({ data: null, isPending: false, error: null });
          return;
        }
        const payload = (await res.json()) as {
          user: { email: string; name: string | null; picture: string | null };
        };
        const user: User = {
          email: payload.user.email,
          name: payload.user.name,
          image: payload.user.picture,
        };
        if (active) {
          setState({ data: { user, raw: payload as Record<string, unknown> }, isPending: false, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            data: null,
            isPending: false,
            error: error instanceof Error ? error : new Error("Session error"),
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
