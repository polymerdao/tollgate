"use client";

import { use } from "react";
import { useSite } from "@/lib/hooks/use-site";
import { usePayouts } from "@/lib/hooks/use-payouts";
import { formatUSDC, formatUSD, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CheckCircle, XCircle, Clock } from "lucide-react";

const statusConfig = {
  completed: { variant: "success" as const, icon: CheckCircle },
  pending: { variant: "warning" as const, icon: Clock },
  failed: { variant: "danger" as const, icon: XCircle },
};

export default function PayoutsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: site, isLoading: siteLoading } = useSite(id);
  const { data: payouts, isLoading: payoutsLoading } = usePayouts(id);

  const isLoading = siteLoading || payoutsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Current Balance"
          value={site ? formatUSDC(site.balance) : "--"}
        />
        <Card className="flex flex-col gap-1 p-5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Stripe Status
          </span>
          {site?.stripeAccountId ? (
            <span className="flex items-center gap-2 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
              <span className="text-lg font-bold">Connected</span>
            </span>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-muted-foreground">Not Connected</span>
              <Button size="sm" variant="outline">
                Connect Stripe
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Record of all payouts to your Stripe account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!payouts || payouts.length === 0 ? (
            <EmptyState message="No payouts yet. Payouts are processed automatically when your balance reaches the threshold." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => {
                  const config = statusConfig[payout.status as keyof typeof statusConfig] ?? statusConfig.pending;
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>{formatDate(payout.createdAt)}</TableCell>
                      <TableCell className="font-mono">{formatUSD(payout.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{payout.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
