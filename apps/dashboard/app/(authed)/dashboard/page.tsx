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
import { Globe, Plus, ArrowRight, Zap, Shield, BarChart3, CheckCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const { data: sites, isLoading } = useSites();

  const totalRevenue = sites?.reduce((sum, s) => sum + (s.balance ?? 0), 0) ?? 0;
  const activeSites = sites?.filter((s) => s.status === "active").length ?? 0;
  const totalSites = sites?.length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  // Empty state — no sites yet
  if (!sites || sites.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Welcome to Tollgate</h2>
          <p className="text-muted-foreground">
            Charge AI bots for accessing your content using the x402 payment protocol.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Add your first site</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Register a domain, set your pricing, and start earning from bot traffic in minutes.
              </p>
            </div>
            <Link href="/dashboard/sites/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add Site
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Instant setup</p>
                <p className="text-xs text-muted-foreground">Add a DNS record and CDN rule. Bots pay automatically.</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">No crypto needed</p>
                <p className="text-xs text-muted-foreground">Bots pay on-chain. You receive USD via Stripe.</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Full visibility</p>
                <p className="text-xs text-muted-foreground">See which bots access what content and how much you earn.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Sites exist — show overview metrics
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Balance" value={formatUSDC(totalRevenue)} />
        <MetricCard label="Active Sites" value={String(activeSites)} />
        <MetricCard label="Total Sites" value={String(totalSites)} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Sites</CardTitle>
          <Link href="/dashboard/sites/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Site
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.domain}</TableCell>
                  <TableCell>
                    {site.verifiedAt ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
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
                  <TableCell className="font-mono text-sm">
                    {formatUSDC(site.balance)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/sites/${site.id}/pricing`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
