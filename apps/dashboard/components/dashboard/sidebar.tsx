"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/integrations", label: "Integrations", icon: Puzzle },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="flex h-full flex-col">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2">
        <Link href="/">
          <span className="text-lg font-bold tracking-tight text-foreground">Tollgate</span>
        </Link>
        <span className="inline-flex items-center border border-primary/60 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">
          Beta
        </span>
      </div>

      <div className="divider-diamond mb-6">
        <div className="diamond" />
      </div>

      {/* Main navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "nav-active-glow text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {isActive && (
                <span className="absolute right-3 h-1.5 w-1.5 bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto space-y-1">
        <div className="divider-diamond mb-3">
          <div className="diamond" />
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
