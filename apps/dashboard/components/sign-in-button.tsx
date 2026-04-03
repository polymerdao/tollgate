"use client";
import { startGoogleLogin } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button onClick={() => startGoogleLogin()} size="lg">
      Sign in with Google
    </Button>
  );
}
