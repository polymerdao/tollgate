"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  AUTH_FLOW_DEVICE,
  AUTH_FLOW_QUERY_PARAM,
  getAuthCallbackOutcome,
  consumeAuthReturnTo
} from "@/lib/auth-flow";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="card-bracket w-full max-w-md bg-card/90 p-8 backdrop-blur-sm">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        </div>
      }
    >
      <AuthCallbackPageContent />
    </Suspense>
  );
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const callbackFlow =
    searchParams.get(AUTH_FLOW_QUERY_PARAM) === AUTH_FLOW_DEVICE
      ? AUTH_FLOW_DEVICE
      : null;

  const [returnTo] = useState(() => {
    if (callbackFlow !== AUTH_FLOW_DEVICE) {
      return null;
    }
    return consumeAuthReturnTo(AUTH_FLOW_DEVICE);
  });
  const outcome = getAuthCallbackOutcome(isPending, Boolean(session?.user), returnTo);
  const redirectPath = outcome.kind === "redirect" ? outcome.path : null;

  useEffect(() => {
    if (!redirectPath) return;
    router.replace(redirectPath);
  }, [redirectPath, router]);

  if (outcome.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card-bracket w-full max-w-md bg-card/90 p-8 backdrop-blur-sm">
          <div className="bracket-bl" />
          <div className="bracket-br" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (outcome.kind === "retry") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card-bracket w-full max-w-md bg-card/90 p-8 backdrop-blur-sm text-center">
          <div className="bracket-bl" />
          <div className="bracket-br" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SIGN-IN FAILED</h1>
          <p className="mt-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            We couldn&apos;t confirm your session. Please try signing in again.
          </p>
          <Link
            href={outcome.path}
            className="group relative mt-8 inline-flex items-center justify-center gap-3 overflow-hidden border border-[#d4c19a] bg-transparent px-10 py-3 text-sm font-semibold uppercase tracking-widest text-[#d4c19a] transition-all duration-500 hover:bg-[#d4c19a] hover:text-black"
          >
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
