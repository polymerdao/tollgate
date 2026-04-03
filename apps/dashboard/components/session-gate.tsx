"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserFromSession, type SessionState } from "@/lib/types";

export function SessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sessionState = useSession() as SessionState;
  const user = getUserFromSession(sessionState);
  const isPending = sessionState.isPending;

  useEffect(() => {
    if (!isPending && !user) {
      router.replace("/login");
    }
  }, [isPending, user, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-10">
        <div className="mx-auto grid max-w-5xl gap-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
