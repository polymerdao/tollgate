"use client";

import { use } from "react";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { formatUSDC } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useAnalytics(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <EmptyState message="No analytics data available yet. Data will appear once your site starts receiving bot traffic." />
      </Card>
    );
  }

  const chartData = data.revenueByDay.map((d) => ({
    date: d.date,
    revenue: d.amount / 1_000_000,
  }));

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Revenue" value={formatUSDC(data.totalRevenue)} />
        <MetricCard label="Total Payments" value={data.totalPayments.toLocaleString()} />
        <MetricCard
          label="Success Rate"
          value={`${(data.successRate * 100).toFixed(1)}%`}
        />
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
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

      {/* Top pages */}
      {data.topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPages.map((page) => (
                  <TableRow key={page.path}>
                    <TableCell className="font-mono text-sm">{page.path}</TableCell>
                    <TableCell className="text-right">{page.count}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatUSDC(page.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payments by bot */}
      {data.paymentsByBot.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payments by Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Agent</TableHead>
                  <TableHead className="text-right">Payments</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.paymentsByBot.map((bot) => (
                  <TableRow key={bot.userAgent}>
                    <TableCell className="max-w-xs truncate font-mono text-sm">
                      {bot.userAgent}
                    </TableCell>
                    <TableCell className="text-right">{bot.count}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatUSDC(bot.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
