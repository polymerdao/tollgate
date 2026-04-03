"use client";

import Link from "next/link";
import { useSites } from "@/lib/hooks/use-sites";
import { formatUSDC } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { EmptyState } from "@/components/dashboard/empty-state";
import { Plus, CheckCircle, Clock } from "lucide-react";

export default function SitesPage() {
  const { data: sites, isLoading } = useSites();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Card>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Sites</h2>
          <Link href="/dashboard/sites/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Site
            </Button>
          </Link>
        </div>
        <Card>
          <EmptyState message="No sites yet. Add your first site to start monetizing bot traffic.">
            <Link href="/dashboard/sites/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add Site
              </Button>
            </Link>
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sites</h2>
        <Link href="/dashboard/sites/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Site
          </Button>
        </Link>
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="font-medium text-foreground hover:text-primary transition"
                  >
                    {site.domain}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={site.status === "active" ? "success" : "warning"}>
                    {site.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {site.verifiedAt ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Pending
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatUSDC(site.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
