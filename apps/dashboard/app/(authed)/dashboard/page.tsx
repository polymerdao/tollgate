"use client";

import Link from "next/link";
import { useSites } from "@/lib/hooks/use-sites";
import { useAggregateAnalytics } from "@/lib/hooks/use-aggregate-analytics";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Globe, Plus, ArrowRight, Zap, Shield, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: analytics, isLoading: analyticsLoading } = useAggregateAnalytics();

  const isLoading = sitesLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
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

  const chartData = (analytics?.revenueByDay ?? []).map((d) => ({
    date: d.date,
    revenue: d.amount / 1_000_000,
  }));

  const hasActivity = (analytics?.totalAttempts ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Total Revenue" value={formatUSDC(analytics?.totalRevenue ?? 0)} />
        <MetricCard label="Paid Requests" value={(analytics?.totalPayments ?? 0).toLocaleString()} />
        <MetricCard label="Bot Requests" value={(analytics?.totalAttempts ?? 0).toLocaleString()} />
        <MetricCard
          label="Success Rate"
          value={hasActivity ? `${((analytics?.successRate ?? 0) * 100).toFixed(1)}%` : "—"}
        />
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sites operational status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sites</CardTitle>
            <Link href="/dashboard/sites/new">
              <Button size="sm" variant="outline">
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
                      {!site.verifiedAt ? (
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Unverified
                        </span>
                      ) : (
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
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatUSDC(site.balance ?? 0)}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/sites/${site.id}/setup`}>
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

        {/* Top bots */}
        <Card>
          <CardHeader>
            <CardTitle>Top Bots</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics?.topBots?.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No bot activity yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Agent</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topBots.map((bot) => (
                    <TableRow key={bot.userAgent}>
                      <TableCell className="max-w-[180px] truncate font-mono text-xs">
                        {bot.userAgent}
                      </TableCell>
                      <TableCell className="text-right">{bot.count}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatUSDC(bot.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout method status */}
      {sites.some((s) => s.verifiedAt && !s.stripeAccountId && !s.payoutWalletAddress) && (
        <Card className="border-amber-600/30 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Payout method missing</p>
              <p className="text-xs text-muted-foreground">
                {sites.filter((s) => s.verifiedAt && !s.stripeAccountId && !s.payoutWalletAddress).length} site(s) have no payout method configured.{" "}
                <Link href="/dashboard/payouts" className="underline underline-offset-2">
                  Set up payouts
                </Link>
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              {sites
                .filter((s) => s.verifiedAt && (s.stripeAccountId || s.payoutWalletAddress))
                .map((s) => (
                  <span key={s.id} className="flex items-center gap-1 text-xs text-emerald-500">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {s.domain}
                  </span>
                ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
