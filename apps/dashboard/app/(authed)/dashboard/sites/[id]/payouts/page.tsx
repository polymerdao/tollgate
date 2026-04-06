"use client";

import { use, useState } from "react";
import { useSite } from "@/lib/hooks/use-site";
import { usePayouts } from "@/lib/hooks/use-payouts";
import { useQueryClient } from "@tanstack/react-query";
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
import { EmptyState } from "@/components/dashboard/empty-state";
import { WalletConnectButton } from "@/components/dashboard/wallet-connect-button";
import { CheckCircle, XCircle, Clock, DollarSign, Wallet } from "lucide-react";

const statusConfig = {
  completed: { variant: "success" as const, icon: CheckCircle },
  pending: { variant: "warning" as const, icon: Clock },
  failed: { variant: "danger" as const, icon: XCircle },
};

export default function PayoutsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: site, isLoading: siteLoading } = useSite(id);
  const { data: payouts, isLoading: payoutsLoading } = usePayouts(id);

  const [connecting, setConnecting] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const queryClient = useQueryClient();
  const isLoading = siteLoading || payoutsLoading;

  async function connectStripe() {
    setConnecting(true);
    try {
      const res = await fetch(`/api/v1/sites/${id}/stripe/connect`, { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setConnecting(false);
    }
  }

  async function saveWallet(address: string) {
    setSavingWallet(true);
    try {
      await fetch(`/api/v1/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutWalletAddress: address }),
      });
      await queryClient.invalidateQueries({ queryKey: ["site", id] });
    } finally {
      setSavingWallet(false);
    }
  }

  async function requestPayout() {
    setPayingOut(true);
    try {
      const res = await fetch(`/api/v1/sites/${id}/payouts`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Payout failed");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["payouts", id] });
      await queryClient.invalidateQueries({ queryKey: ["site", id] });
    } finally {
      setPayingOut(false);
    }
  }

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

  const hasPayoutMethod = !!(site?.stripeAccountId || site?.payoutWalletAddress);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-1 p-5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current Balance
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {site ? formatUSDC(site.balance) : "--"}
            </span>
            {hasPayoutMethod && (
              <Button size="sm" variant="outline" onClick={requestPayout} disabled={payingOut}>
                {payingOut ? "Processing..." : "Request Payout"}
              </Button>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-2 p-5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Payout Method
          </span>

          {site?.stripeAccountId ? (
            <span className="flex items-center gap-2 text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">Stripe Connected</span>
            </span>
          ) : site?.payoutWalletAddress ? (
            <span className="flex items-center gap-2 text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              <Wallet className="h-4 w-4" />
              <span className="font-mono text-sm font-semibold">
                {site.payoutWalletAddress.slice(0, 6)}…{site.payoutWalletAddress.slice(-4)}
              </span>
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={connectStripe} disabled={connecting}>
                  <DollarSign className="h-4 w-4" />
                  {connecting ? "Connecting..." : "Connect Stripe"}
                </Button>
                <WalletConnectButton onAddressSelected={saveWallet} saving={savingWallet} />
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Record of all payouts to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!payouts || payouts.length === 0 ? (
            <EmptyState message="No payouts yet. Request a payout once your balance exceeds $10." />
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
