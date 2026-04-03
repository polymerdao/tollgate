"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSite } from "@/lib/hooks/use-site";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Pricing", segment: "pricing" },
  { label: "Bots", segment: "bots" },
  { label: "Payouts", segment: "payouts" },
  { label: "Analytics", segment: "analytics" },
  { label: "Settings", segment: "settings" },
] as const;

export default function SiteDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: site, isLoading } = useSite(id);
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Site heading */}
      {isLoading ? (
        <Skeleton className="h-8 w-48" />
      ) : (
        <h2 className="text-2xl font-bold">{site?.domain ?? "Site"}</h2>
      )}

      {/* Tab navigation */}
      <nav className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const href = `/dashboard/sites/${id}/${tab.segment}`;
          const isActive = pathname === href;
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
