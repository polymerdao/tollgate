import type { ReactNode } from "react";
import { SessionGate } from "@/components/session-gate";
import { DashboardShell } from "@/components/dashboard/shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <DashboardShell>{children}</DashboardShell>
    </SessionGate>
  );
}
