"use client";

import Link from "next/link";
import { useSites } from "@/lib/hooks/use-sites";
import { formatUSDC } from "@/lib/format";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

export default function PayoutsPage() {
  const { data: sites, isLoading } = useSites();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const activeSites = sites?.filter((s) => s.status === "active") ?? [];
  const totalBalance = sites?.reduce((sum, s) => sum + (s.balance ?? 0), 0) ?? 0;
  const sitesWithBalance = sites?.filter((s) => (s.balance ?? 0) > 0) ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Payouts</h2>
        <p className="text-sm text-muted-foreground">Total earnings across all your sites.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Total Balance" value={formatUSDC(totalBalance)} />
        <MetricCard label="Active Sites" value={String(activeSites.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {!sites || sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sites yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id} className={sitesWithBalance.includes(site) ? "" : "opacity-50"}>
                    <TableCell className="font-medium">{site.domain}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          site.status === "active"
                            ? "success"
                            : site.status === "paused"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {site.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatUSDC(site.balance ?? 0)}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/sites/${site.id}/payouts`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
