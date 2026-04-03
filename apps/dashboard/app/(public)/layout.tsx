import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <a
          href="https://cdn.polymerlabs.org/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-foreground"
        >
          Privacy Policy
        </a>
        <span className="mx-2">&middot;</span>
        <a
          href="https://cdn.polymerlabs.org/legal/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-foreground"
        >
          Terms of Service
        </a>
      </footer>
    </div>
  );
}
