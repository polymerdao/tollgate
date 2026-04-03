"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const titleMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/sites": "Sites",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const title = useMemo(() => {
    if (!pathname) return "Dashboard";
    return titleMap[pathname] ?? "Dashboard";
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Atmospheric overlays */}
      <div className="dash-grid" />
      <div className="dash-vignette" />
      <div className="corner-glow corner-glow-animated" style={{ position: "fixed", top: -100, left: -100 }} />
      <div className="corner-glow corner-glow-animated" style={{ position: "fixed", bottom: -100, right: -100, animationDelay: "4s" }} />

      <div className="relative z-10 flex">
        {/* Desktop sidebar */}
        <div className="sidebar-glass sticky top-0 hidden h-screen w-56 p-5 md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent className="sidebar-glass w-56 p-5 md:hidden">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 min-h-screen flex-1 flex-col px-4 py-8 md:px-8">
          <Topbar
            title={title}
            onOpenNav={() => setOpen(true)}
          />

          <div className="mt-8 flex-1 space-y-8">{children}</div>
          <footer className="mt-12 pb-4 text-center text-xs text-muted-foreground">
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
        </main>
      </div>
    </div>
  );
}
